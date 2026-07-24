-- Run once in Supabase SQL Editor.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  plan text not null check (plan in ('lite', 'pro')),
  payment_id text unique not null,
  access_until timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
-- There are intentionally no client policies. Subscription reads/writes go
-- through server functions using SUPABASE_SERVICE_ROLE_KEY.

create table if not exists public.song_health_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('uploading','queued','processing','ready','failed','cancelled','expired')),
  stem_count smallint not null check (stem_count between 1 and 12),
  input_prefix text not null,
  input_manifest jsonb not null default '[]'::jsonb,
  output_path text,
  plan jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz
);

create index if not exists song_health_jobs_user_created_idx
  on public.song_health_jobs (user_id, created_at desc);
create index if not exists song_health_jobs_queue_idx
  on public.song_health_jobs (status, created_at) where status = 'queued';
alter table public.song_health_jobs enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('song-health-inputs', 'song-health-inputs', false, 209715200,
  array['audio/wav','audio/x-wav','audio/wave','audio/flac','audio/x-flac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('song-health-results', 'song-health-results', false, 2147483648,
  array['application/zip'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "song health users upload own stems" on storage.objects;
create policy "song health users upload own stems" on storage.objects for insert to authenticated
with check (bucket_id = 'song-health-inputs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "song health users inspect own stems" on storage.objects;
create policy "song health users inspect own stems" on storage.objects for select to authenticated
using (bucket_id = 'song-health-inputs' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.claim_song_health_job(worker_name text)
returns setof public.song_health_jobs
language plpgsql security definer set search_path = public
as $$
declare picked public.song_health_jobs;
begin
  select * into picked from public.song_health_jobs
  where status = 'queued' order by created_at for update skip locked limit 1;
  if picked.id is null then return; end if;
  update public.song_health_jobs set status = 'processing', started_at = now(), updated_at = now()
  where id = picked.id returning * into picked;
  return next picked;
end;
$$;

revoke all on function public.claim_song_health_job(text) from public, anon, authenticated;
grant execute on function public.claim_song_health_job(text) to service_role;
