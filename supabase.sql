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
