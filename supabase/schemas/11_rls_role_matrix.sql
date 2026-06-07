-- ============================================================
-- DeviceHub — role-matrix RLS policies
-- This file runs AFTER 08_members.sql (which defines app_role/app_dept
-- and the member_role type). All policies here use those helpers.
-- ============================================================

-- ---- member, settings, preferences, activity ----

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
-- (drop the broad "authenticated" policies from 06_rls.sql first)
-- ============================================================

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

drop policy if exists "authenticated_select_department" on department;
drop policy if exists "authenticated_insert_department" on department;
drop policy if exists "authenticated_update_department" on department;
drop policy if exists "authenticated_delete_department" on department;
create policy department_read        on department for select using (true);
create policy department_write_admin on department for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

drop policy if exists "authenticated_select_device_group" on device_group;
drop policy if exists "authenticated_insert_device_group" on device_group;
drop policy if exists "authenticated_update_device_group" on device_group;
drop policy if exists "authenticated_delete_device_group" on device_group;
create policy device_group_read        on device_group for select using (true);
create policy device_group_write_admin on device_group for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');

drop policy if exists "authenticated_select_manufacturer" on manufacturer;
drop policy if exists "authenticated_insert_manufacturer" on manufacturer;
drop policy if exists "authenticated_update_manufacturer" on manufacturer;
drop policy if exists "authenticated_delete_manufacturer" on manufacturer;
create policy manufacturer_read        on manufacturer for select using (true);
create policy manufacturer_write_admin on manufacturer for all using (app_role() = 'it_admin') with check (app_role() = 'it_admin');
