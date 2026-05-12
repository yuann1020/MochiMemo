-- Phase 6 follow-up: create profile rows from Supabase Auth users.
-- This makes profile creation reliable even when email confirmation delays the first client session.

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, currency, monthly_budget)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      'MochiMemo user'
    ),
    'MYR',
    2000
  )
  on conflict (id) do update
    set display_name = coalesce(public.profiles.display_name, excluded.display_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

insert into public.profiles (id, display_name, currency, monthly_budget)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'MochiMemo user'
  ),
  'MYR',
  2000
from auth.users as auth_user
where not exists (
  select 1
  from public.profiles as profile
  where profile.id = auth_user.id
)
on conflict (id) do nothing;

comment on function public.create_profile_for_auth_user() is
  'Creates public.profiles rows for auth.users so app data can be owned by auth.uid().';

--comment on trigger on_auth_user_created_create_profile on auth.users is
--  'Creates a public profile row whenever a Supabase Auth user is created.';
