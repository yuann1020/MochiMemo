# Phase 6 Auth And Security

Phase 6 adds Supabase email/password auth and replaces the Phase 4 demo RLS policies with user-owned rows.

## Auth Flow

- `app/_layout.tsx` initializes the auth store once and redirects unauthenticated users to `/login`.
- `app/(tabs)/_layout.tsx` blocks the tab UI until auth initialization completes.
- `/login` signs in with email/password.
- `/register` creates an email/password account and creates a `profiles` row when Supabase returns a session.
- A database trigger also creates a `profiles` row whenever a Supabase Auth user is created.
- The profile id is the same uuid as `auth.users.id`.
- `/profile` shows the signed-in email, profile display name, currency, monthly budget, and a logout button.

## Database Ownership

`profiles.id` maps to `auth.users.id`.

`expenses.profile_id` maps to `profiles.id` and must equal `auth.uid()` for authenticated writes.

The app no longer writes to the Phase 4 demo profile. New saves always set:

```ts
profile_id = session.user.id
```

## RLS Policies

The Phase 6 migration drops:

- `Demo profiles access`
- `Demo expenses access`

It adds:

- profiles select/insert/update where `auth.uid() = id`
- expenses select/insert/update/delete where `profile_id = auth.uid()`

Profile deletes are intentionally not exposed from the app in this phase.

## Migration

Create or use the included migration:

```bash
npx supabase migration new phase_6_auth_security
```

Apply migrations:

```bash
npx supabase db push
```

The included migration preserves existing demo rows. It adds the `profiles.id -> auth.users.id` foreign key as `NOT VALID` so historical demo rows do not block the migration. New profile rows must still reference real Supabase auth users.

The follow-up migration adds:

- `public.create_profile_for_auth_user()`
- `on_auth_user_created_create_profile` trigger on `auth.users`
- a backfill for any existing auth users without profile rows

After old demo data is no longer needed, delete or migrate the demo rows and validate the constraint:

```sql
alter table public.profiles validate constraint profiles_id_auth_users_fkey;
```

## Edge Functions

The mobile client now passes the current Supabase access token to:

- `extract-expense`
- `transcribe-audio`

Both Edge Functions now validate the `Authorization: Bearer <access token>` header before calling OpenAI. Deploy normally after applying Phase 6:

```bash
npx supabase functions deploy extract-expense
npx supabase functions deploy transcribe-audio
```

If you temporarily deploy with `--no-verify-jwt` for local troubleshooting, the functions still require a valid Supabase user token at runtime.

Required Supabase function secrets:

```bash
OPENAI_API_KEY=
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided by the Supabase Functions runtime and are used only server-side to validate user tokens.

Do not put `OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`, or service role keys in Expo env.

## Expo Env

Expo still only needs:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Two User Test

1. Log out or clear the app session.
2. Register user A.
3. Save `Bubble tea RM12, parking RM5`.
4. Confirm Home, History, Insights, and Budget Alert show user A data.
5. Log out.
6. Register user B.
7. Confirm user B sees empty totals/history.
8. Save a different expense for user B.
9. In Supabase Table Editor, confirm each expense row has `profile_id` equal to the correct auth user id.
10. Log back in as user A and confirm user B expenses are not visible.

## Limitations

- Password reset is a visual placeholder only.
- OAuth providers are not implemented.
- Legacy demo rows are preserved but hidden by RLS.
- Edge Functions may still be deployed with `--no-verify-jwt` during local testing; database writes are protected by RLS either way.
