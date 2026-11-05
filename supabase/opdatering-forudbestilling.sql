-- Chicken World – opdatering: ordrer kan bestilles op til 14 dage frem
-- Kør hele filen én gang i Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Ordreskærmen viser nu også aktive ordrer (ny, i gang, klar), der er bestilt op til 16 dage før,
-- så en ordre til om to uger ikke forsvinder fra skærmen dagen efter, den blev bestilt.

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
       or (status in ('ny', 'i gang', 'klar') and created_at > now() - interval '16 days')
    order by created_at desc;
end $$;

grant execute on function public.staff_orders(text, integer) to public;

notify pgrst, 'reload schema';
