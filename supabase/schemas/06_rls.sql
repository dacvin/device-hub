-- ============================================================
-- DeviceHub — Row Level Security
-- Policy: any authenticated user can perform any CRUD on any table.
-- Anonymous users have no access.
-- ============================================================

-- ---- department ----
alter table department enable row level security;

create policy "authenticated_select_department"
  on department for select to authenticated using (true);
create policy "authenticated_insert_department"
  on department for insert to authenticated with check (true);
create policy "authenticated_update_department"
  on department for update to authenticated using (true) with check (true);
create policy "authenticated_delete_department"
  on department for delete to authenticated using (true);

-- ---- device_group ----
alter table device_group enable row level security;

create policy "authenticated_select_device_group"
  on device_group for select to authenticated using (true);
create policy "authenticated_insert_device_group"
  on device_group for insert to authenticated with check (true);
create policy "authenticated_update_device_group"
  on device_group for update to authenticated using (true) with check (true);
create policy "authenticated_delete_device_group"
  on device_group for delete to authenticated using (true);

-- ---- manufacturer ----
alter table manufacturer enable row level security;

create policy "authenticated_select_manufacturer"
  on manufacturer for select to authenticated using (true);
create policy "authenticated_insert_manufacturer"
  on manufacturer for insert to authenticated with check (true);
create policy "authenticated_update_manufacturer"
  on manufacturer for update to authenticated using (true) with check (true);
create policy "authenticated_delete_manufacturer"
  on manufacturer for delete to authenticated using (true);

-- ---- device ----
alter table device enable row level security;

create policy "authenticated_select_device"
  on device for select to authenticated using (true);
create policy "authenticated_insert_device"
  on device for insert to authenticated with check (true);
create policy "authenticated_update_device"
  on device for update to authenticated using (true) with check (true);
create policy "authenticated_delete_device"
  on device for delete to authenticated using (true);

-- ---- device_photo ----
alter table device_photo enable row level security;

create policy "authenticated_select_device_photo"
  on device_photo for select to authenticated using (true);
create policy "authenticated_insert_device_photo"
  on device_photo for insert to authenticated with check (true);
create policy "authenticated_update_device_photo"
  on device_photo for update to authenticated using (true) with check (true);
create policy "authenticated_delete_device_photo"
  on device_photo for delete to authenticated using (true);

-- ---- device_document ----
alter table device_document enable row level security;

create policy "authenticated_select_device_document"
  on device_document for select to authenticated using (true);
create policy "authenticated_insert_device_document"
  on device_document for insert to authenticated with check (true);
create policy "authenticated_update_device_document"
  on device_document for update to authenticated using (true) with check (true);
create policy "authenticated_delete_device_document"
  on device_document for delete to authenticated using (true);

-- Note: device_with_flags is a view with security_invoker = true,
-- so it inherits RLS from device. No separate policies needed.
-- Role-matrix policies are applied in 11_rls_role_matrix.sql
-- (must load after 08_members.sql which defines app_role/app_dept).
