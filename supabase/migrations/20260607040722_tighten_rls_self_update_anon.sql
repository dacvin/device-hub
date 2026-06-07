drop policy "department_read" on "public"."department";

drop policy "device_read" on "public"."device";

drop policy "device_document_read" on "public"."device_document";

drop policy "device_group_read" on "public"."device_group";

drop policy "device_photo_read" on "public"."device_photo";

drop policy "manufacturer_read" on "public"."manufacturer";

drop policy "member_read_all" on "public"."member";

drop policy "member_update_self" on "public"."member";

drop policy "org_settings_read" on "public"."org_settings";


  create policy "department_read"
  on "public"."department"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "device_read"
  on "public"."device"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "device_document_read"
  on "public"."device_document"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "device_group_read"
  on "public"."device_group"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "device_photo_read"
  on "public"."device_photo"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "manufacturer_read"
  on "public"."manufacturer"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "member_read_all"
  on "public"."member"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "member_update_self"
  on "public"."member"
  as permissive
  for update
  to public
using ((id = auth.uid()))
with check (((id = auth.uid()) AND (role = ( SELECT m.role
   FROM public.member m
  WHERE (m.id = auth.uid()))) AND (status = ( SELECT m.status
   FROM public.member m
  WHERE (m.id = auth.uid()))) AND (NOT (department_id IS DISTINCT FROM ( SELECT m.department_id
   FROM public.member m
  WHERE (m.id = auth.uid())))) AND (NOT (reports_to IS DISTINCT FROM ( SELECT m.reports_to
   FROM public.member m
  WHERE (m.id = auth.uid())))) AND (NOT (invited_by IS DISTINCT FROM ( SELECT m.invited_by
   FROM public.member m
  WHERE (m.id = auth.uid()))))));



  create policy "org_settings_read"
  on "public"."org_settings"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



