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

create table if not exists public.available_slots (
  id uuid primary key default gen_random_uuid(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null default 1 check (capacity > 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at),
  check (reserved_count <= capacity)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.available_slots(id) on delete restrict,
  name text not null,
  email text not null,
  line_display_name text,
  line_user_id text,
  plan reservation_plan not null,
  message text,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create index if not exists available_slots_start_at_idx
  on public.available_slots (start_at);

create index if not exists available_slots_active_capacity_idx
  on public.available_slots (is_active, start_at)
  where is_active = true;

create index if not exists reservations_slot_id_idx
  on public.reservations (slot_id);

create index if not exists reservations_status_idx
  on public.reservations (status);

create index if not exists reservations_line_user_id_idx
  on public.reservations (line_user_id)
  where line_user_id is not null;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists available_slots_set_updated_at on public.available_slots;
create trigger available_slots_set_updated_at
before update on public.available_slots
for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create or replace function public.create_reservation_with_slot(
  p_slot_id uuid,
  p_name text,
  p_email text,
  p_line_display_name text,
  p_line_user_id text,
  p_plan reservation_plan,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.available_slots%rowtype;
  v_reservation_id uuid;
begin
  select *
    into v_slot
    from public.available_slots
    where id = p_slot_id
    for update;

  if not found then
    raise exception 'slot_not_found';
  end if;

  if v_slot.is_active is not true then
    raise exception 'slot_inactive';
  end if;

  if v_slot.start_at <= now() then
    raise exception 'slot_closed';
  end if;

  if v_slot.reserved_count >= v_slot.capacity then
    raise exception 'slot_full';
  end if;

  update public.available_slots
    set reserved_count = reserved_count + 1
    where id = p_slot_id;

  insert into public.reservations (
    slot_id,
    name,
    email,
    line_display_name,
    line_user_id,
    plan,
    message,
    status
  )
  values (
    p_slot_id,
    p_name,
    p_email,
    nullif(p_line_display_name, ''),
    nullif(p_line_user_id, ''),
    p_plan,
    nullif(p_message, ''),
    'pending'
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

create or replace function public.update_reservation_status(
  p_reservation_id uuid,
  p_status reservation_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_slot public.available_slots%rowtype;
begin
  select *
    into v_reservation
    from public.reservations
    where id = p_reservation_id
    for update;

  if not found then
    raise exception 'reservation_not_found';
  end if;

  if v_reservation.status = p_status then
    return;
  end if;

  select *
    into v_slot
    from public.available_slots
    where id = v_reservation.slot_id
    for update;

  if v_reservation.status = 'cancelled' and p_status in ('pending', 'confirmed') then
    if v_slot.reserved_count >= v_slot.capacity then
      raise exception 'slot_full';
    end if;

    update public.available_slots
      set reserved_count = reserved_count + 1
      where id = v_reservation.slot_id;
  end if;

  if v_reservation.status in ('pending', 'confirmed') and p_status = 'cancelled' then
    update public.available_slots
      set reserved_count = greatest(reserved_count - 1, 0)
      where id = v_reservation.slot_id;
  end if;

  update public.reservations
    set status = p_status
    where id = p_reservation_id;
end;
$$;

alter table public.available_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Allow public available slot read" on public.available_slots;
create policy "Allow public available slot read"
on public.available_slots
for select
to anon, authenticated
using (
  is_active = true
  and start_at > now()
  and reserved_count < capacity
);

drop policy if exists "Block public reservation read" on public.reservations;
create policy "Block public reservation read"
on public.reservations
for select
to anon, authenticated
using (false);

drop policy if exists "Block public admin user read" on public.admin_users;
create policy "Block public admin user read"
on public.admin_users
for select
to anon, authenticated
using (false);

grant execute on function public.create_reservation_with_slot(
  uuid,
  text,
  text,
  text,
  text,
  reservation_plan,
  text
) to anon, authenticated;
