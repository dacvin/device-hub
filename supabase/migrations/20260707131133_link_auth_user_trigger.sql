set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.link_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update public.users
     set auth_user_id = new.id,
         status       = 'active',
         joined_at    = coalesce(joined_at, current_date)
   where lower(email) = lower(new.email)
     and deleted_at is null;
  return new;
end;
$function$
;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.link_auth_user();


