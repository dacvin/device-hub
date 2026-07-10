set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.enforce_checkout_availability()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_total   int;
  v_on_loan int;
begin
  select quantity into v_total from public.devices where id = new.device_id;

  select coalesce(sum(c.quantity - coalesce(ci.taken, 0)), 0)
    into v_on_loan
  from public.checkouts c
  left join (
    select checkout_id, sum(quantity) as taken
    from public.checkins group by checkout_id
  ) ci on ci.checkout_id = c.id
  where c.device_id = new.device_id
    and c.id <> new.id;

  if new.quantity + v_on_loan > v_total then
    raise exception
      'checkout of % exceeds available (% owned, % already out)',
      new.quantity, v_total, v_on_loan
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$
;

CREATE TRIGGER checkouts_enforce_availability BEFORE INSERT OR UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION private.enforce_checkout_availability();


