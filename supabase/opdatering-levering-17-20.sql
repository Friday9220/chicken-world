-- Chicken World – opdatering: levering kun kl. 17–20 (alle åbne dage). Afhentning er uændret.
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run. Kan trygt køres flere gange.
--
-- Hjemmesiden viser kun leveringstider kl. 17–20, men databasen tjekker det også, så en ordre ikke kan
-- snyde sig udenom. Tjekket ligger i en trigger på orders, så place_order ikke skal ændres.
-- Tidspunktet står i pickup-teksten, fx "Levering i dag kl. 17.30" eller "Levering i dag hurtigst muligt (ca. 45 min)".
-- Ændres tiderne, så ret både tallene herunder og delivery.from/to i site-config.js.

create or replace function private.check_delivery_time()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_from  constant integer := 17 * 60;  -- første leveringstid (minutter efter midnat)
  v_to    constant integer := 20 * 60;  -- sidste leveringstid
  v_lead  constant integer := 45;       -- ca. leveringstid ved "hurtigst muligt"
  v_now   timestamp := now() at time zone 'Europe/Copenhagen';
  v_mins  integer;
  v_parts text[];
begin
  if coalesce(new.pickup, '') !~* '^\s*levering' then
    return new;  -- afhentning: ingen begrænsning her
  end if;
  v_parts := regexp_match(new.pickup, 'kl\.?\s*(\d{1,2})[.:](\d{2})');
  if v_parts is not null then
    v_mins := v_parts[1]::integer * 60 + v_parts[2]::integer;
  elsif new.pickup ~* 'hurtigst' then
    v_mins := extract(hour from v_now)::integer * 60 + extract(minute from v_now)::integer + v_lead;
    -- lidt luft, så et ur, der går lidt forkert, ikke afviser kunden
    if v_mins between v_from - 15 and v_to then
      return new;
    end if;
  else
    raise exception 'Vælg et leveringstidspunkt mellem kl. 17 og 20.';
  end if;
  if v_mins < v_from or v_mins > v_to then
    raise exception 'Vi leverer kun mellem kl. 17 og 20. Vælg et andet tidspunkt, eller vælg afhentning.';
  end if;
  return new;
end $$;

drop trigger if exists orders_delivery_time on public.orders;
create trigger orders_delivery_time
  before insert on public.orders
  for each row execute function private.check_delivery_time();
