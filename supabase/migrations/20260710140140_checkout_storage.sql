drop policy "authenticated delete device files" on "storage"."objects";

drop policy "authenticated read device files" on "storage"."objects";

drop policy "authenticated update device files" on "storage"."objects";

drop policy "authenticated write device files" on "storage"."objects";


  create policy "authenticated delete device files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text, 'checkout-photos'::text])));



  create policy "authenticated read device files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text, 'checkout-photos'::text])));



  create policy "authenticated update device files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text, 'checkout-photos'::text])))
with check ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text, 'checkout-photos'::text])));



  create policy "authenticated write device files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text, 'checkout-photos'::text])));



