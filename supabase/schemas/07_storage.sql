-- ============================================================
-- DeviceHub — Storage object RLS
-- Buckets themselves are declared in supabase/config.toml under
-- [storage.buckets.device-photos] and [storage.buckets.device-documents].
-- This file grants any authenticated user full CRUD on objects inside
-- those two buckets (mirrors the table policies in 06_rls.sql).
-- ============================================================

create policy "authenticated_select_device_photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'device-photos');

create policy "authenticated_insert_device_photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'device-photos');

create policy "authenticated_update_device_photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'device-photos')
  with check (bucket_id = 'device-photos');

create policy "authenticated_delete_device_photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'device-photos');

create policy "authenticated_select_device_documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'device-documents');

create policy "authenticated_insert_device_documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'device-documents');

create policy "authenticated_update_device_documents"
  on storage.objects for update to authenticated
  using (bucket_id = 'device-documents')
  with check (bucket_id = 'device-documents');

create policy "authenticated_delete_device_documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'device-documents');
