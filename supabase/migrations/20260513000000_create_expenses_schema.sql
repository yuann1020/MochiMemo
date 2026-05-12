create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  currency text default 'MYR',
  monthly_budget numeric default 2000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  amount numeric not null,
  currency text not null default 'MYR',
  merchant text not null,
  category text not null,
  note text,
  spent_at timestamptz not null default now(),
  source text not null default 'manual',
  confidence numeric,
  raw_input text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists expenses_spent_at_idx on public.expenses (spent_at desc);
create index if not exists expenses_category_idx on public.expenses (category);
create index if not exists expenses_created_at_idx on public.expenses (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

insert into public.profiles (id, display_name, currency, monthly_budget)
values ('00000000-0000-0000-0000-000000000001', 'Demo Profile', 'MYR', 2000)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;

comment on table public.profiles is
  'MochiMemo profiles. Phase 4 uses a seeded demo profile until auth is implemented.';
comment on table public.expenses is
  'MochiMemo expenses. TODO Phase 6: replace demo RLS policies with user-based auth.uid() policies.';

drop policy if exists "Demo profiles access" on public.profiles;
create policy "Demo profiles access"
on public.profiles
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Demo expenses access" on public.expenses;
create policy "Demo expenses access"
on public.expenses
for all
to anon, authenticated
using (true)
with check (true);
