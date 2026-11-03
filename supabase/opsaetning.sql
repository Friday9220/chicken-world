-- Chicken World – ordrer fra hjemmesiden
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Erstat ERSTAT_MED_HEMMELIG_NOEGLE nederst med personalets hemmelige nøgle.

create schema if not exists private;
revoke all on schema private from public;

-- Hemmelig nøgle til den interne ordreside
create table if not exists private.settings (
  staff_key text not null check (length(staff_key) >= 24 and staff_key <> 'ERSTAT_MED_HEMMELIG_NOEGLE')
);

alter table private.settings enable row level security;

create table if not exists public.orders (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  phone      text not null,
  pickup     text not null,
  note       text,
  items      jsonb not null,
  total      integer not null,
  status     text not null default 'ny'
             check (status in ('ny', 'i gang', 'klar', 'afhentet', 'annulleret'))
);

-- Ingen kan læse eller ændre tabellen direkte. Alt går gennem funktionerne nedenfor.
alter table public.orders enable row level security;
revoke all on public.orders from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.orders from anon, authenticated';
  end if;
end $$;

-- Kunden lægger en bestilling
create or replace function public.place_order(
  p_name text, p_phone text, p_pickup text, p_note text, p_items jsonb, p_total integer
) returns bigint
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_id bigint;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if length(trim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'Ugyldigt navn';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'Ugyldigt telefonnummer';
  end if;
  if length(coalesce(p_pickup, '')) not between 1 and 60 or length(coalesce(p_note, '')) > 500 then
    raise exception 'Ugyldig afhentning eller bemærkning';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 60
     or length(p_items::text) > 20000 then
    raise exception 'Ugyldig kurv';
  end if;
  if p_total is null or p_total not between 1 and 20000 then
    raise exception 'Ugyldig pris';
  end if;
  -- Bremse mod spam: højst 3 bestillinger fra samme nummer på 10 minutter
  if (select count(*) from orders
      where phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'For mange bestillinger på kort tid. Ring venligst til os.';
  end if;

  insert into orders (name, phone, pickup, note, items, total)
  values (trim(p_name), v_phone, p_pickup, nullif(trim(coalesce(p_note, '')), ''), p_items, p_total)
  returning id into v_id;
  return v_id;
end $$;

-- Personalet henter ordrer (kræver nøglen)
create or replace function public.staff_orders(p_key text, p_hours integer default 18)
returns setof public.orders
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from private.settings where staff_key = p_key) then
    raise exception 'Adgang nægtet';
  end if;
  return query
    select * from orders
    where created_at > now() - make_interval(hours => least(greatest(p_hours, 1), 168))
    order by created_at desc;
end $$;

-- Personalet ændrer status på en ordre (kræver nøglen)
create or replace function public.staff_set_status(p_key text, p_id bigint, p_status text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from private.settings where staff_key = p_key) then
    raise exception 'Adgang nægtet';
  end if;
  update orders set status = p_status where id = p_id;
end $$;

grant usage on schema public to public;
grant execute on function public.place_order(text, text, text, text, jsonb, integer) to public;
grant execute on function public.staff_orders(text, integer) to public;
grant execute on function public.staff_set_status(text, bigint, text) to public;

-- Sæt personalets hemmelige nøgle (kør filen igen med en ny nøgle for at skifte den)
delete from private.settings;
insert into private.settings (staff_key) values ('ERSTAT_MED_HEMMELIG_NOEGLE');
