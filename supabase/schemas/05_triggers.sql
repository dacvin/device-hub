-- ============================================================
-- DeviceHub — triggers
-- Attach timestamp functions from 04_functions.sql to each table.
-- ============================================================

-- ---- department ----
create trigger department_set_timestamps_insert
  before insert on department
  for each row execute function set_created_and_updated_at();

create trigger department_set_timestamps_update
  before update on department
  for each row execute function set_updated_at();

-- ---- device_group ----
create trigger device_group_set_timestamps_insert
  before insert on device_group
  for each row execute function set_created_and_updated_at();

create trigger device_group_set_timestamps_update
  before update on device_group
  for each row execute function set_updated_at();

-- ---- manufacturer ----
create trigger manufacturer_set_timestamps_insert
  before insert on manufacturer
  for each row execute function set_created_and_updated_at();

create trigger manufacturer_set_timestamps_update
  before update on manufacturer
  for each row execute function set_updated_at();

-- ---- device ----
create trigger device_set_timestamps_insert
  before insert on device
  for each row execute function set_created_and_updated_at();

create trigger device_set_timestamps_update
  before update on device
  for each row execute function set_updated_at();

-- ---- device_photo (insert-only) ----
create trigger device_photo_set_created_at
  before insert on device_photo
  for each row execute function set_created_at_only();

-- ---- device_document (insert-only) ----
create trigger device_document_set_created_at
  before insert on device_document
  for each row execute function set_created_at_only();
