# Track Start authentication setup

The implementation uses passwordless Supabase Magic Links. Free tools remain
available without signing in; purchase and paid access require an account.

## 1. Supabase

1. Open **SQL Editor** and run `supabase.sql`.
2. In **Authentication → URL Configuration**, set:
   - Site URL: `https://www.trackstart.art`
   - Redirect URLs:
     - `https://www.trackstart.art/**`
     - `https://track-start-sooty.vercel.app/**`
     - the project's Vercel preview pattern while testing
3. Enable the Email provider. Magic Link templates can use the defaults for the
   first test.

## 2. Vercel environment variables

Add to Preview first, then Production after verification:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=public anon key
SUPABASE_SERVICE_ROLE_KEY=server-only service role key
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in HTML or client JavaScript. The
`/api/auth-config` endpoint only returns the public URL and anon key.

Existing variables remain required:

```text
YOOKASSA_SHOP_ID
YOOKASSA_SECRET_KEY
TRIAL_COOKIE_SECRET
```

## 3. Verification before production

1. Deploy a Preview.
2. Enter an email and follow its Magic Link.
3. Confirm the header shows the email.
4. Run a real/test YooKassa payment while signed in.
5. Open the Preview in another browser, sign in with the same email, and verify
   that the paid plan is restored.
6. Confirm a row exists in `public.subscriptions` and no secret key appears in
   browser source or network responses.

The current browser-only plan token is retained as a compatibility cache, but
it is now regenerated from the server-side subscription on every sign-in.
