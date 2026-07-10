create or replace view "public"."users_with_activity" WITH (security_invoker=on) as  SELECT id,
    auth_user_id,
    name,
    email,
    phone,
    role,
    status,
    joined_at,
    last_active_at,
    invited_by,
    created_at,
    updated_at,
    deleted_at,
    ( SELECT max(a.created_at) AS max
           FROM public.activities a
          WHERE (a.actor_id = u.id)) AS last_action_at
   FROM public.users u;

grant select on public.users_with_activity to authenticated;
grant select on public.users_with_activity to service_role;

