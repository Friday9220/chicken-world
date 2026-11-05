-- Chicken World – opdatering: mailadresse på bestillinger og rabatkoden KYLLING20
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Den ændrer ikke eksisterende ordrer og kan trygt køres flere gange.
--
-- KYLLING20: 20 % rabat på maden (ikke levering) på kundens første bestilling online.
-- Gælder fra 6. november 2026 til og med 6. december 2026 (dansk tid).
-- Kun ved køb af mad for mindst 250 kr. Én gang pr. mailadresse. Afviste og annullerede ordrer tæller ikke med.

-- Nye kolonner på bestillingen
alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists discount_code text;
alter table public.orders add column if not exists discount integer not null default 0;
create index if not exists orders_email_idx on public.orders (email);

-- Rabatkoder (kan ikke læses udefra)
create table if not exists private.discount_codes (
  code             text primary key,
  percent          integer not null check (percent between 1 and 100),
  valid_from       timestamptz not null,
  valid_to         timestamptz not null,
  first_order_only boolean not null default true,
  min_food         integer not null default 0
);
alter table private.discount_codes add column if not exists min_food integer not null default 0;
alter table private.discount_codes enable row level security;

insert into private.discount_codes (code, percent, valid_from, valid_to, first_order_only, min_food)
values ('kylling20', 20,
        timestamptz '2026-11-06 00:00 Europe/Copenhagen',
        timestamptz '2026-12-07 00:00 Europe/Copenhagen',
        true, 250)
on conflict (code) do update
  set percent = excluded.percent, valid_from = excluded.valid_from,
      valid_to = excluded.valid_to, first_order_only = excluded.first_order_only,
      min_food = excluded.min_food;

-- Tjekker en rabatkode for en mailadresse. Giver procent tilbage eller en fejl med forklaring.
create or replace function private.discount_percent(p_email text, p_code text)
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_code  text := lower(trim(coalesce(p_code, '')));
  d private.discount_codes%rowtype;
begin
  select * into d from private.discount_codes where code = v_code;
  if not found then
    raise exception 'Rabatkoden findes ikke';
  end if;
  if now() < d.valid_from then
    raise exception 'Rabatkoden kan først bruges fra %', to_char(d.valid_from at time zone 'Europe/Copenhagen', 'FMDD.FMMM.YYYY');
  end if;
  if now() >= d.valid_to then
    raise exception 'Rabatkoden er udløbet';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Skriv din mailadresse for at bruge rabatkoden';
  end if;
  if exists (select 1 from orders
             where email = v_email and status not in ('afvist', 'annulleret')
               and (discount_code = v_code or d.first_order_only)) then
    raise exception 'Rabatkoden kan kun bruges én gang og kun på din første bestilling';
  end if;
  return d.percent;
end $$;

-- Hjemmesiden tjekker koden, når kunden trykker "Brug"
create or replace function public.check_discount(p_email text, p_code text)
returns integer
language sql security definer set search_path = public, pg_temp
as $$ select private.discount_percent(p_email, p_code); $$;

-- Kunden lægger en bestilling (nu med mailadresse og evt. rabatkode)
drop function if exists public.place_order(text, text, text, text, jsonb, integer);
create or replace function public.place_order(
  p_name text, p_phone text, p_pickup text, p_note text, p_items jsonb, p_total integer,
  p_email text default null, p_code text default null, p_discount integer default 0
) returns bigint
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_id bigint;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_code text := nullif(lower(trim(coalesce(p_code, ''))), '');
  v_discount integer := coalesce(p_discount, 0);
  v_pct integer;
  v_food integer;
  v_min integer;
begin
  if length(trim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'Ugyldigt navn';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 8 and 15 then
    raise exception 'Ugyldigt telefonnummer';
  end if;
  if v_email is not null and (length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Ugyldig mailadresse';
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
  if v_code is null then
    v_discount := 0;
  else
    v_pct := private.discount_percent(v_email, v_code);
    -- Maden (uden levering og kørselstillæg) skal koste mindst kodens minimum
    select coalesce(sum((i->>'qty')::numeric * (i->>'price')::numeric), 0)::integer into v_food
      from jsonb_array_elements(p_items) i
      where (i->>'price')::numeric > 0 and coalesce(i->>'name', '') not in ('Levering', 'Kørselstillæg');
    select min_food into v_min from private.discount_codes where code = v_code;
    if v_food < coalesce(v_min, 0) then
      raise exception 'Rabatkoden gælder kun ved køb af mad for mindst % kr.', v_min;
    end if;
    -- Rabatten må højst være procenten af beløbet før rabat (+1 kr for afrunding)
    if v_discount < 0 or v_discount > ((p_total + v_discount) * v_pct) / 100 + 1 then
      raise exception 'Ugyldig rabat';
    end if;
  end if;
  -- Bremse mod spam: højst 3 bestillinger fra samme nummer på 10 minutter
  if (select count(*) from orders
      where phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'For mange bestillinger på kort tid. Ring venligst til os.';
  end if;

  insert into orders (name, phone, email, pickup, note, items, total, discount_code, discount)
  values (trim(p_name), v_phone, v_email, p_pickup, nullif(trim(coalesce(p_note, '')), ''), p_items, p_total, v_code, v_discount)
  returning id into v_id;
  return v_id;
end $$;

-- staff_orders returnerer hele rækken; den genskabes, så de nye felter kommer med
drop function if exists public.staff_orders(text, integer);
create function public.staff_orders(p_key text, p_hours integer default 18)
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
       or (status in ('ny', 'i gang', 'klar') and created_at > now() - interval '16 days')
    order by created_at desc;
end $$;

revoke all on function private.discount_percent(text, text) from public;
grant execute on function public.check_discount(text, text) to public;
grant execute on function public.place_order(text, text, text, text, jsonb, integer, text, text, integer) to public;
grant execute on function public.staff_orders(text, integer) to public;

notify pgrst, 'reload schema';
