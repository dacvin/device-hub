drop policy "users_update" on "public"."users";


  create policy "users_update"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR (auth_user_id = ( SELECT auth.uid() AS uid))))
with check (((role = ( SELECT u.role
   FROM public.users u
  WHERE (u.id = users.id))) AND (email = ( SELECT u.email
   FROM public.users u
  WHERE (u.id = users.id))) AND (public.is_admin() OR ((auth_user_id = ( SELECT auth.uid() AS uid)) AND (status = ( SELECT u.status
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))) AND (NOT (auth_user_id IS DISTINCT FROM ( SELECT u.auth_user_id
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (invited_by IS DISTINCT FROM ( SELECT u.invited_by
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (deleted_at IS DISTINCT FROM ( SELECT u.deleted_at
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (joined_at IS DISTINCT FROM ( SELECT u.joined_at
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (last_active_at IS DISTINCT FROM ( SELECT u.last_active_at
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))))))));



