-- Chicken World – opdatering: rabatkoden giver ikke rabat på frokosttilbud.
-- Frokosttilbud tæller heller ikke med i minimumsbeløbet (250 kr.).
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Kræver at opdatering-rabatkode.sql er kørt først. Kan trygt køres flere gange.

-- Minimumsbeløbet på rabatkoden (samme som opdatering-rabat-minimum.sql, så den fil ikke også skal køres)
alter table private.discount_codes add column if not exists min_food integer not null default 0;
update private.discount_codes set min_food = 250 where code = 'kylling20';

-- Kunden lægger en bestilling (nu med mailadresse og evt. rabatkode)
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
    -- Maden (uden levering, kørselstillæg og frokosttilbud) skal koste mindst kodens minimum
    select coalesce(sum((i->>'qty')::numeric * (i->>'price')::numeric), 0)::integer into v_food
      from jsonb_array_elements(p_items) i
      where (i->>'price')::numeric > 0 and coalesce(i->>'name', '') not in ('Levering', 'Kørselstillæg')
        and coalesce(i->>'section', '') <> 'Frokost';
    select min_food into v_min from private.discount_codes where code = v_code;
    if v_food < coalesce(v_min, 0) then
      raise exception 'Rabatkoden gælder kun ved køb af mad for mindst % kr.', v_min;
    end if;
    -- Rabatten må højst være procenten af maden uden frokosttilbud (+1 kr for afrunding)
    if v_discount < 0 or v_discount > (v_food * v_pct) / 100 + 1 then
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

grant execute on function public.place_order(text, text, text, text, jsonb, integer, text, text, integer) to public;

notify pgrst, 'reload schema';
