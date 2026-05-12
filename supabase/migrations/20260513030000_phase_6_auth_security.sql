-- Phase 6: replace demo access with Supabase Auth owned rows.
-- Existing demo rows are preserved for reference but are no longer readable through RLS.

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Demo profiles access" on public.profiles;
drop policy if exists "Demo expenses access" on public.expenses;

drop policy if exists "Users can select own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users can select own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

-- Preserve old demo rows by adding the auth.users FK as NOT VALID.
-- New profile rows must match an auth user; historical demo profile rows can be cleaned later.
alter table public.profiles
  drop constraint if exists profiles_id_auth_users_fkey;

alter table public.profiles
  alter column id drop default;

alter table public.profiles
  add constraint profiles_id_auth_users_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade
  not valid;

-- Existing Phase 4 data should already point to the seeded demo profile. If any row is null,
-- attach it to that legacy profile before making authenticated writes strict.
update public.expenses
set profile_id = '00000000-0000-0000-0000-000000000001'
where profile_id is null;

alter table public.expenses
  alter column profile_id set not null;

alter table public.expenses
  drop constraint if exists expenses_profile_id_fkey;

alter table public.expenses
  add constraint expenses_profile_id_fkey
  foreign key (profile_id)
  references public.profiles(id)
  on delete cascade;

create policy "Users can select own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can select own expenses"
on public.expenses
for select
to authenticated
using (profile_id = auth.uid());

create policy "Users can insert own expenses"
on public.expenses
for insert
to authenticated
with check (profile_id = auth.uid());

create policy "Users can update own expenses"
on public.expenses
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Users can delete own expenses"
on public.expenses
for delete
to authenticated
using (profile_id = auth.uid());

comment on table public.profiles is
  'MochiMemo user profiles. Phase 6 removes demo policies; rows are owned by auth.users.id.';

comment on table public.expenses is
  'MochiMemo expenses. Phase 6 RLS restricts access to rows where profile_id = auth.uid().';

comment on constraint profiles_id_auth_users_fkey on public.profiles is
  'NOT VALID preserves legacy demo profile rows. TODO: delete or migrate demo data, then validate this constraint.';
