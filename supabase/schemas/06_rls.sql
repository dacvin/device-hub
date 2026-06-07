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

-- ============================================================
-- Member, settings, preferences, activity — RLS
-- ============================================================

alter table member          enable row level security;
alter table org_settings    enable row level security;
alter table user_preference enable row level security;
alter table activity        enable row level security;

create policy member_read_all     on member for select using (true);
create policy member_write_admin  on member for insert with check (app_role() = 'it_admin');
create policy member_update_admin on member for update using (app_role() = 'it_admin') with check (app_role() = 'it_admin');
create policy member_update_self  on member for update using (id = auth.uid()) with check (id = auth.uid());
create policy member_delete_admin on member for delete using (app_role() = 'it_admin');

create policy org_settings_read  on org_settings for select using (true);
create policy org_settings_write on org_settings for update using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

create policy user_pref_self_read   on user_preference for select using (user_id = auth.uid());
create policy user_pref_self_insert on user_preference for insert with check (user_id = auth.uid());
create policy user_pref_self_update on user_preference for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy activity_read_all on activity for select using (auth.role() = 'authenticated');

-- ============================================================
-- Tighten device + catalog write policies to the role matrix
-- ============================================================

-- (Inspect existing device/catalog policies in this file before appending.
-- If any of the policy names below collide, drop-and-recreate; otherwise just append.)

drop policy if exists device_write_all on device;
drop policy if exists device_write on device;
drop policy if exists device_read on device;

drop policy if exists "authenticated_select_device" on device;
drop policy if exists "authenticated_insert_device" on device;
drop policy if exists "authenticated_update_device" on device;
drop policy if exists "authenticated_delete_device" on device;

create policy device_read  on device for select using (true);
create policy device_write on device for all using (
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
) with check (
  app_role() = 'it_admin'
  or (app_role() = 'manager' and department_id = app_dept())
);

drop policy if exists device_photo_read on device_photo;
drop policy if exists device_photo_write on device_photo;
drop policy if exists "authenticated_select_device_photo" on device_photo;
drop policy if exists "authenticated_insert_device_photo" on device_photo;
drop policy if exists "authenticated_update_device_photo" on device_photo;
drop policy if exists "authenticated_delete_device_photo" on device_photo;
create policy device_photo_read on device_photo for select using (true);
create policy device_photo_write on device_photo for all using (
  exists (select 1 from device d where d.id = device_photo.device_id
          and (app_role() = 'it_admin'
               or (app_role() = 'manager' and d.department_id = app_dept())))
);

drop policy if exists device_document_read on device_document;
drop policy if exists device_document_write on device_document;
drop policy if exists "authenticated_select_device_document" on device_document;
drop policy if exists "authenticated_insert_device_document" on device_document;
drop policy if exists "authenticated_update_device_document" on device_document;
drop policy if exists "authenticated_delete_device_document" on device_document;
create policy device_document_read on device_document for select using (true);
create policy device_document_write on device_document for all using (
  exists (select 1 from device d where d.id = device_document.device_id
          and (app_role() = 'it_admin'
               or (app_role() = 'manager' and d.department_id = app_dept())))
);

drop policy if exists department_read on department;
drop policy if exists department_write on department;
drop policy if exists department_write_admin on department;
drop policy if exists "authenticated_select_department" on department;
drop policy if exists "authenticated_insert_department" on department;
drop policy if exists "authenticated_update_department" on department;
drop policy if exists "authenticated_delete_department" on department;
create policy department_read        on department for select using (true);
create policy department_write_admin on department for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

drop policy if exists device_group_read on device_group;
drop policy if exists device_group_write on device_group;
drop policy if exists device_group_write_admin on device_group;
drop policy if exists "authenticated_select_device_group" on device_group;
drop policy if exists "authenticated_insert_device_group" on device_group;
drop policy if exists "authenticated_update_device_group" on device_group;
drop policy if exists "authenticated_delete_device_group" on device_group;
create policy device_group_read        on device_group for select using (true);
create policy device_group_write_admin on device_group for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

drop policy if exists manufacturer_read on manufacturer;
drop policy if exists manufacturer_write on manufacturer;
drop policy if exists manufacturer_write_admin on manufacturer;
drop policy if exists "authenticated_select_manufacturer" on manufacturer;
drop policy if exists "authenticated_insert_manufacturer" on manufacturer;
drop policy if exists "authenticated_update_manufacturer" on manufacturer;
drop policy if exists "authenticated_delete_manufacturer" on manufacturer;
create policy manufacturer_read        on manufacturer for select using (true);
create policy manufacturer_write_admin on manufacturer for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');
