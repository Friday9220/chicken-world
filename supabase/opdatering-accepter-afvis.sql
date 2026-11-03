-- Chicken World – opdatering: køkkenet accepterer eller afviser ordrer
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Den ændrer ikke eksisterende ordrer og kan trygt køres flere gange.

-- Nye felter: hvor mange minutter køkkenet har lovet, og hvornår ordren blev accepteret
alter table public.orders add column if not exists eta_minutes integer;
alter table public.orders add column if not exists accepted_at timestamptz;

-- Ny status "afvist"
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('ny', 'i gang', 'klar', 'afhentet', 'annulleret', 'afvist'));

-- staff_orders returnerer hele rækken; den skal genskabes, så de nye felter kommer med
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
    order by created_at desc;
end $$;

-- Køkkenet accepterer en ny ordre, evt. med 15/30/45/60 minutter
create or replace function public.staff_accept(p_key text, p_id bigint, p_minutes integer default null)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from private.settings where staff_key = p_key) then
    raise exception 'Adgang nægtet';
  end if;
  if p_minutes is not null and p_minutes not in (15, 30, 45, 60) then
    raise exception 'Ugyldig tid';
  end if;
  update orders set status = 'i gang', eta_minutes = p_minutes, accepted_at = now()
  where id = p_id and status = 'ny';
end $$;

-- Køkkenet afviser en ny ordre
create or replace function public.staff_reject(p_key text, p_id bigint)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from private.settings where staff_key = p_key) then
    raise exception 'Adgang nægtet';
  end if;
  update orders set status = 'afvist' where id = p_id and status = 'ny';
end $$;

-- Kunden ser status på sin egen ordre (kræver ordrenummer OG telefonnummer)
create or replace function public.order_status(p_id bigint, p_phone text)
returns table (status text, eta_minutes integer, accepted_at timestamptz)
language sql security definer set search_path = public, pg_temp
as $$
  select o.status, o.eta_minutes, o.accepted_at
  from orders o
  where o.id = p_id
    and o.phone = regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')
    and o.created_at > now() - interval '1 day';
$$;

grant execute on function public.staff_orders(text, integer) to public;
grant execute on function public.staff_accept(text, bigint, integer) to public;
grant execute on function public.staff_reject(text, bigint) to public;
grant execute on function public.order_status(bigint, text) to public;

-- Få Supabase til at kende de nye funktioner med det samme
notify pgrst, 'reload schema';
