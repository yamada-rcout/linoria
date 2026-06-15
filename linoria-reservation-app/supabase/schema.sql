create extension if not exists pgcrypto;

do $$ begin
  create type reservation_plan as enum (
    'initial_consultation',
    'career_consultation',
    'support_plan'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type reservation_status as enum (
    'pending',
    'confirmed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  line_display_name text,
  line_user_id text,
  plan reservation_plan not null,
  desired_at timestamptz not null,
  message text,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reservations_desired_at_idx
  on public.reservations (desired_at);

create index if not exists reservations_status_idx
  on public.reservations (status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

alter table public.reservations enable row level security;

drop policy if exists "Allow public reservation insert" on public.reservations;
create policy "Allow public reservation insert"
on public.reservations
for insert
to anon
with check (status = 'pending');

drop policy if exists "Block public reservation read" on public.reservations;
create policy "Block public reservation read"
on public.reservations
for select
to anon
using (false);
