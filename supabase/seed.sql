-- ============================================================
-- DeviceHub — seed data (runs after migrations on `supabase db reset`)
-- Matches schemas/02_tables.sql exactly. Lookups by name → devices reference
-- them via subquery, so you don't hand-manage UUIDs. Idempotent:
-- uses ON CONFLICT (name/code) DO NOTHING so re-running won't duplicate.
--
-- Photo URLs are in-bucket keys (e.g. 'DEV-2041-XPS.png') for the
-- `device-photos` bucket. The path stored here is what
-- `signedPhotoUrl(path)` passes to `from('device-photos').createSignedUrl()`.
-- ============================================================

-- ---- Departments ----
INSERT INTO department (name, manager, primary_location) VALUES
  ('Engineering', 'Linh Tran',  'HCMC · Floor 4'),
  ('Design',      'Mai Nguyen', 'HCMC · Floor 3'),
  ('Product',     'Hung Pham',  'HCMC · Floor 3'),
  ('Sales',       'Quan Le',    'Hanoi · Floor 2'),
  ('Finance',     'Thao Vo',    'HCMC · Floor 5'),
  ('HR',          'Anh Bui',    'HCMC · Floor 2'),
  ('IT',          'Duc Hoang',  'HCMC · Server room'),
  ('Operations',  'Trang Dao',  'HCMC · Floor 1')
ON CONFLICT (name) DO NOTHING;

-- ---- Device groups (icon = lucide name, default inventory cycle in months) ----
INSERT INTO device_group (name, icon, default_inventory_cycle_months) VALUES
  ('Laptop',     'laptop',     12),
  ('Desktop',    'pc-case',    12),
  ('Monitor',    'monitor',    24),
  ('Printer',    'printer',    12),
  ('Network',    'network',     6),
  ('Server',     'server',      6),
  ('Mobile',     'smartphone', 12),
  ('Peripheral', 'webcam',     24)
ON CONFLICT (name) DO NOTHING;

-- ---- Manufacturers ----
INSERT INTO manufacturer (name, support_contact) VALUES
  ('Dell',     'support.dell.com'),
  ('Apple',    'getsupport.apple.com'),
  ('Lenovo',   'support.lenovo.com'),
  ('HP',       'support.hp.com'),
  ('Cisco',    'support.cisco.com'),
  ('Synology', 'synology.com/support'),
  ('Logitech', 'support.logi.com'),
  ('Samsung',  'samsung.com/support')
ON CONFLICT (name) DO NOTHING;

-- ---- Devices ----
INSERT INTO device (
  code, name, group_id, department_id, manufacturer_id,
  model, serial_number, specifications,
  condition, location, quantity, unit, source, status,
  import_date, last_check_date, inventory_cycle_months, warranty_start, warranty_end
)
SELECT v.code, v.name,
       (SELECT id FROM device_group WHERE name = v.grp),
       (SELECT id FROM department   WHERE name = v.dept),
       (SELECT id FROM manufacturer WHERE name = v.mfr),
       v.model, v.serial, v.specs,
       v.condition, v.location, v.quantity, v.unit::unit, v.source::device_source, v.status::device_status,
       v.import_date::date, v.last_check::date, v.cycle, v.w_start::date, v.w_end::date
FROM (VALUES
  ('DEV-2041-XPS','Dell XPS 15 9530','Laptop','Engineering','Dell','XPS 15 9530','5KQ8R2','Intel i7-13700H · 32GB · 1TB SSD · RTX 4050',92,'HCMC · Floor 4 · Desk E-12',1,'piece','Purchased','in-use','2023-08-14','2025-03-02',12,'2023-08-14','2026-08-14'),
  ('DEV-2088-MBP','MacBook Pro 14 M3','Laptop','Design','Apple','MacBook Pro 14','C02XR3','Apple M3 Pro · 36GB · 1TB SSD',88,'HCMC · Floor 3 · Desk D-04',1,'piece','Purchased','in-use','2024-01-20','2026-04-11',12,'2024-01-20','2027-01-20'),
  ('DEV-1903-T14','ThinkPad T14 Gen 4','Laptop','Sales','Lenovo','ThinkPad T14','PF3K9A','AMD Ryzen 7 · 16GB · 512GB SSD',74,'Hanoi · Floor 2 · Desk S-21',1,'piece','Leased','in-use','2022-06-30','2026-03-18',12,'2022-06-30','2025-06-30'),
  ('DEV-3110-U27','Dell UltraSharp U2723QE','Monitor','Engineering','Dell','U2723QE','CN0H2M','27" 4K IPS · USB-C 90W hub',96,'HCMC · Floor 4 · Desk E-12',2,'piece','Purchased','in-use','2023-08-14','2025-03-02',24,'2023-08-14','2026-08-14'),
  ('DEV-4501-LJ','HP LaserJet Pro M404','Printer','Operations','HP','LaserJet M404','VNB8C1','Mono laser · duplex · network',61,'HCMC · Floor 1 · Print room',1,'piece','Purchased','in-use','2021-11-05','2024-01-09',12,'2021-11-05','2023-11-05'),
  ('DEV-5002-SW','Cisco Catalyst 9200','Network','IT','Cisco','Catalyst 9200','FOC24K','48-port PoE+ managed switch',99,'HCMC · Server room · Rack A',1,'piece','Purchased','in-use','2024-03-12','2026-04-30',6,'2024-03-12','2029-03-12'),
  ('DEV-5210-NAS','Synology RS1221+','Server','IT','Synology','RS1221+','21F0PT','8-bay rackmount NAS · 64TB',95,'HCMC · Server room · Rack A',1,'piece','Purchased','in-use','2023-02-28','2026-04-30',6,'2023-02-28','2026-02-28'),
  ('DEV-6033-IPH','iPhone 14 (test)','Mobile','Product','Apple','iPhone 14','DX3R8L','128GB · QA device pool',80,'HCMC · Floor 3 · QA cabinet',1,'piece','Purchased','in-storage','2023-05-19','2026-02-22',12,'2023-05-19','2025-05-19'),
  ('DEV-7001-C920','Logitech C920 Webcam','Peripheral','HR','Logitech','C920','LZ9920','1080p webcam · meeting rooms',70,'HCMC · Floor 2 · Meeting B',4,'set','Purchased','in-use','2022-09-10','2024-11-15',24,'2022-09-10','2024-09-10'),
  ('DEV-3140-S27','Samsung S27 ViewFinity','Monitor','Finance','Samsung','S27 ViewFinity','SM27VF','27" QHD · 100Hz',90,'HCMC · Floor 5 · Desk F-08',1,'piece','Purchased','in-use','2024-02-02','2025-03-28',24,'2024-02-02','2027-02-02'),
  ('DEV-1850-OPT','Dell OptiPlex 7010','Desktop','Finance','Dell','OptiPlex 7010','DLOPT7','i5-13500 · 16GB · 512GB — PSU fault, awaiting part',34,'Service bench · HCMC · IT',1,'piece','Purchased','in-repair','2020-04-17','2026-02-01',12,'2020-04-17','2023-04-17'),
  ('DEV-1620-PRE','Lenovo ThinkCentre M70q','Desktop','Sales','Lenovo','ThinkCentre M70q','LNM70Q','Decommissioned — pending disposal',55,'Storage · Hanoi · Cabinet 1',1,'piece','Transferred','retired','2019-12-03','2023-06-20',12,'2019-12-03','2022-12-03')
) AS v(code,name,grp,dept,mfr,model,serial,specs,condition,location,quantity,unit,source,status,import_date,last_check,cycle,w_start,w_end)
ON CONFLICT (code) DO NOTHING;

-- ---- Cover photos ----
-- Path stored = in-bucket key (no `device-photos/` prefix — the bucket is implicit).
INSERT INTO device_photo (device_id, url, file_name, sort_order)
SELECT d.id, p.url, p.file_name, 0
FROM (VALUES
  ('DEV-2041-XPS',  'DEV-2041-XPS.png',  'DEV-2041-XPS.png'),
  ('DEV-2088-MBP',  'DEV-2088-MBP.png',  'DEV-2088-MBP.png'),
  ('DEV-1903-T14',  'DEV-1903-T14.png',  'DEV-1903-T14.png'),
  ('DEV-3110-U27',  'DEV-3110-U27.png',  'DEV-3110-U27.png'),
  ('DEV-4501-LJ',   'DEV-4501-LJ.png',   'DEV-4501-LJ.png'),
  ('DEV-5002-SW',   'DEV-5002-SW.png',   'DEV-5002-SW.png'),
  ('DEV-5210-NAS',  'DEV-5210-NAS.png',  'DEV-5210-NAS.png'),
  ('DEV-6033-IPH',  'DEV-6033-IPH.png',  'DEV-6033-IPH.png'),
  ('DEV-7001-C920', 'DEV-7001-C920.png', 'DEV-7001-C920.png'),
  ('DEV-3140-S27',  'DEV-3140-S27.png',  'DEV-3140-S27.png'),
  ('DEV-1850-OPT',  'DEV-1850-OPT.png',  'DEV-1850-OPT.png'),
  ('DEV-1620-PRE',  'DEV-1620-PRE.png',  'DEV-1620-PRE.png')
) AS p(code, url, file_name)
JOIN device d ON d.code = p.code
ON CONFLICT DO NOTHING;

UPDATE device d
SET cover_photo_id = ph.id
FROM device_photo ph
WHERE ph.device_id = d.id AND ph.sort_order = 0 AND d.cover_photo_id IS NULL;

-- ---- Org settings (singleton) ----
-- The schema's INSERT runs only when the table is created from schema files,
-- not when applied via a migration. Seed it here so first sign-in / Overview
-- / Settings can always read the singleton.
INSERT INTO org_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
