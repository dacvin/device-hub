-- ============================================================
-- DeviceHub — relational schema (PostgreSQL)
-- Source of truth for tables & migrations. DeviceStatus is DERIVED
-- at read time (see device_with_status view), never stored.
-- ============================================================

-- ---- Enums ----
CREATE TYPE unit          AS ENUM ('piece', 'set', 'box');
CREATE TYPE device_source AS ENUM ('Purchased', 'Leased', 'Donated', 'Transferred');

-- Lifecycle status: a device is exactly ONE of these at a time. STORED, set by
-- admins (assign → in-use, send to service → in-repair, decommission → retired).
CREATE TYPE device_status AS ENUM ('in-use', 'in-storage', 'in-repair', 'retired');

-- ---- Lookup tables ----
CREATE TABLE department (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL UNIQUE,
  manager           text,
  primary_location  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device_group (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                           text NOT NULL UNIQUE,
  icon                           text,                 -- lucide icon name
  default_inventory_cycle_months int  NOT NULL DEFAULT 12,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE manufacturer (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  support_contact text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---- Core: device ----
CREATE TABLE device (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                   text NOT NULL UNIQUE,                 -- e.g. DEV-2041-XPS
  name                   text NOT NULL,

  group_id               uuid NOT NULL REFERENCES device_group(id) ON DELETE RESTRICT,
  department_id          uuid NOT NULL REFERENCES department(id)   ON DELETE RESTRICT,
  manufacturer_id        uuid          REFERENCES manufacturer(id) ON DELETE SET NULL,

  model                  text,
  serial_number          text,
  specifications         text,
  notes                  text,

  condition              int  NOT NULL DEFAULT 100 CHECK (condition BETWEEN 0 AND 100),
  location               text,
  quantity               int  NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit                   unit NOT NULL DEFAULT 'piece',
  source                 device_source,
  status                 device_status NOT NULL DEFAULT 'in-storage',  -- lifecycle state (stored)

  import_date            date,
  last_check_date        date,
  inventory_cycle_months int  NOT NULL DEFAULT 12,
  warranty_start         date,
  warranty_end           date,

  cover_photo_id         uuid,                                 -- FK added after device_photo exists
  deleted_at             timestamptz,                          -- soft delete (NULL = active)

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CHECK (warranty_end IS NULL OR warranty_start IS NULL OR warranty_end >= warranty_start)
);

CREATE INDEX device_group_idx        ON device(group_id);
CREATE INDEX device_department_idx   ON device(department_id);
CREATE INDEX device_manufacturer_idx ON device(manufacturer_id);
CREATE INDEX device_active_idx       ON device(deleted_at) WHERE deleted_at IS NULL;

-- ---- Uploaded assets ----
CREATE TABLE device_photo (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  url        text NOT NULL,
  file_name  text,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes <= 5242880),  -- <= 5 MB
  sort_order int  NOT NULL DEFAULT 0,                 -- 0 = cover
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_photo_device_idx ON device_photo(device_id, sort_order);

CREATE TABLE device_document (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  uuid NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  url        text NOT NULL,
  file_name  text NOT NULL,
  mime_type  text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_document_device_idx ON device_document(device_id);

-- cover photo FK (deferred until device_photo table exists)
ALTER TABLE device
  ADD CONSTRAINT device_cover_photo_fk
  FOREIGN KEY (cover_photo_id) REFERENCES device_photo(id) ON DELETE SET NULL;

-- ============================================================
-- Derived FLAGS (read-time). Independent of status and of each other —
-- a device can carry zero, one, or both. Status stays separate & stored;
-- condition lives in its own column. Never conflate these three.
-- ============================================================
CREATE VIEW device_with_flags AS
SELECT d.*,
  -- warranty ends within the next 90 days (and not already expired)
  (d.status <> 'retired'
   AND d.warranty_end IS NOT NULL
   AND d.warranty_end >= current_date
   AND d.warranty_end <= current_date + INTERVAL '90 days')          AS flag_warranty_expiring,
  -- last check older than the inventory cycle
  (d.status <> 'retired'
   AND d.last_check_date IS NOT NULL
   AND d.last_check_date < current_date
       - (d.inventory_cycle_months || ' months')::interval)          AS flag_inventory_overdue
FROM device d;

-- Catalog device counts (what the Departments/Groups/Manufacturers pages show):
--   SELECT g.name, COUNT(d.id) FROM device_group g
--   LEFT JOIN device d ON d.group_id = g.id AND d.deleted_at IS NULL
--   GROUP BY g.name;
