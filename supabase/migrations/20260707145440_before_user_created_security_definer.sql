set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.before_user_created(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if v_email is not null and exists (
    select 1 from public.users
    where lower(email) = v_email
      and deleted_at is null
  ) then
    return '{}'::jsonb;  -- allow
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'This email has not been invited to DeviceHub.',
      'http_code', 403
    )
  );
end;
$function$
;


