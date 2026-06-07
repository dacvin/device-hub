
  create policy "activity_insert_authenticated"
  on "public"."activity"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



