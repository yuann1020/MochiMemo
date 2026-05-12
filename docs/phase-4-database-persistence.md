# Phase 4 Database Persistence

Phase 4 saves and reads expenses from Supabase using the public anon key and demo RLS policies. No service role key is used in the mobile app.

## Migration

Run this from the repo root if you use Supabase CLI:

```bash
npx supabase db push
```

The migration file is:

```text
supabase/migrations/20260513000000_create_expenses_schema.sql
```

If you are not using local Supabase CLI migrations, open Supabase Dashboard > SQL Editor and run the SQL from that file.

## Tables

`profiles`

- `id uuid primary key default gen_random_uuid()`
- `display_name text`
- `currency text default 'MYR'`
- `monthly_budget numeric default 2000`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

`expenses`

- `id uuid primary key default gen_random_uuid()`
- `profile_id uuid nullable references profiles(id) on delete set null`
- `amount numeric not null`
- `currency text not null default 'MYR'`
- `merchant text not null`
- `category text not null`
- `note text`
- `spent_at timestamptz not null default now()`
- `source text not null default 'manual'`
- `confidence numeric`
- `raw_input text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## Demo Profile

Until auth is implemented, the app writes expenses to this seeded demo profile:

```text
00000000-0000-0000-0000-000000000001
```

## RLS

RLS is enabled with permissive demo policies for `anon` and `authenticated` roles.

These policies are demo-only. Phase 6 auth must replace them with user-based `auth.uid()` policies before production use.

## Mobile Env

The Expo app only needs:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not add `service_role`, database passwords, or OpenAI keys to Expo env files.
