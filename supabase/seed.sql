-- ============================================================
-- DeviceHub — seed (runs after migrations on `supabase db reset`).
-- Idempotent: ON CONFLICT (name) DO NOTHING on every catalog table.
-- ============================================================

-- ---- Device groups ----
insert into public.groups (name, icon, default_inventory_cycle_months) values
  ('Laptop',     'laptop',     12),
  ('Desktop',    'pc-case',    12),
  ('Monitor',    'monitor',    24),
  ('Printer',    'printer',    12),
  ('Network',    'network',     6),
  ('Server',     'server',      6),
  ('Mobile',     'smartphone', 12),
  ('Peripheral', 'webcam',     24)
on conflict (name) do nothing;

-- ---- Manufacturers ----
insert into public.manufacturers (name, support_contact) values
  ('Dell',     'support.dell.com'),
  ('Apple',    'getsupport.apple.com'),
  ('Lenovo',   'support.lenovo.com'),
  ('HP',       'support.hp.com'),
  ('Cisco',    'support.cisco.com'),
  ('Synology', 'synology.com/support'),
  ('Logitech', 'support.logi.com'),
  ('Samsung',  'samsung.com/support')
on conflict (name) do nothing;

-- ---- Units ----
insert into public.units (name, abbreviation) values
  ('piece', 'pc'),
  ('set',   'set'),
  ('box',   'box')
on conflict (name) do nothing;

-- ---- Local test admin (LOCAL ONLY) ----
-- Email: admin@local.test  Password: password123
-- Bypasses the invite flow by inserting directly into auth.users +
-- auth.identities and creating a matching public.users row.
do $$
declare
  test_auth_user_id uuid;
begin
  select id into test_auth_user_id from auth.users where email = 'admin@local.test';

  if test_auth_user_id is null then
    test_auth_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      test_auth_user_id,
      'authenticated', 'authenticated',
      'admin@local.test',
      extensions.crypt('password123', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Test Admin"}'::jsonb,
      now(), now()
    );

    -- GoTrue's Go scanner refuses NULL token fields — force empty strings.
    update auth.users
       set confirmation_token   = '',
           recovery_token       = '',
           email_change_token_new = '',
           email_change          = '',
           phone_change          = '',
           phone_change_token    = '',
           email_change_token_current = ''
     where id = test_auth_user_id;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), test_auth_user_id, test_auth_user_id::text, 'email',
      jsonb_build_object('sub', test_auth_user_id::text, 'email', 'admin@local.test', 'email_verified', true),
      now(), now(), now()
    );
  end if;

  insert into public.users (auth_user_id, name, email, role, status, joined_at)
  values (test_auth_user_id, 'Test Admin', 'admin@local.test', 'admin', 'active', current_date)
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id,
        role         = excluded.role,
        status       = excluded.status;
end $$;

-- ---- Sample devices ----
-- Demonstrates the JSONB photos array. Real photo uploads happen via
-- the app; here we just reference paths that exist in the bucket.
insert into public.devices (
  code, name, group_id, unit_id, manufacturer_id,
  model, serial_number, specifications,
  condition, location, quantity, source, status,
  import_date, last_check_date, inventory_cycle_months,
  warranty_start, warranty_end, photos
)
select v.code, v.name,
       (select id from public.groups        where name = v.grp),
       (select id from public.units         where name = v.unit_name),
       (select id from public.manufacturers where name = v.mfr),
       v.model, v.serial, v.specs,
       v.condition, v.location, v.quantity,
       v.source::public.device_source, v.status::public.device_status,
       v.import_date::date, v.last_check::date, v.cycle,
       v.w_start::date, v.w_end::date, v.photos::jsonb
from (values
  -- Laptops
  ('DEV-2041-XPS','Dell XPS 15 9530','Laptop','piece','Dell','XPS 15 9530','5KQ8R2','Intel i7-13700H · 32GB · 1TB SSD · RTX 4050',92,'HCMC · Floor 4 · Desk E-12',1,'Purchased','in-use','2023-08-14','2025-03-02',12,'2023-08-14','2026-08-14','[{"path":"DEV-2041-XPS.png","file_name":"DEV-2041-XPS.png","sort_order":0}]'),
  ('DEV-2088-MBP','MacBook Pro 14 M3','Laptop','piece','Apple','MacBook Pro 14','C02XR3','Apple M3 Pro · 36GB · 1TB SSD',88,'HCMC · Floor 3 · Desk D-04',1,'Purchased','in-use','2024-01-20','2026-04-11',12,'2024-01-20','2027-01-20','[{"path":"DEV-2088-MBP.png","file_name":"DEV-2088-MBP.png","sort_order":0}]'),
  ('DEV-1903-T14','ThinkPad T14 Gen 4','Laptop','piece','Lenovo','ThinkPad T14','PF3K9A','AMD Ryzen 7 · 16GB · 512GB SSD',74,'Hanoi · Floor 2 · Desk S-21',1,'Leased','in-use','2022-06-30','2026-03-18',12,'2022-06-30','2025-06-30','[]'),
  ('DEV-2210-MBA','MacBook Air 13 M2','Laptop','piece','Apple','MacBook Air 13','C02YK1','M2 · 16GB · 512GB SSD',95,'HCMC · Floor 4 · Desk B-08',1,'Purchased','in-use','2024-03-12','2026-05-01',12,'2024-03-12','2027-03-12','[]'),
  ('DEV-2299-XPS','Dell XPS 13 Plus','Laptop','piece','Dell','XPS 13 Plus','5LP9M0','i7-1360P · 16GB · 512GB',82,'HCMC · Floor 2 · Desk A-03',1,'Purchased','storage','2023-05-10','2026-01-12',12,'2023-05-10','2026-05-10','[]'),
  ('DEV-2310-T14','ThinkPad T14s Gen 5','Laptop','piece','Lenovo','ThinkPad T14s','PF7K2L','Intel Core Ultra 7 · 32GB · 1TB',91,'Hanoi · Floor 3 · Desk S-11',1,'Purchased','in-use','2025-02-18','2026-04-25',12,'2025-02-18','2028-02-18','[]'),
  -- Desktops
  ('DEV-1850-OPT','Dell OptiPlex 7010','Desktop','piece','Dell','OptiPlex 7010','DLOPT7','i5-13500 · 16GB · 512GB — PSU fault, awaiting part',34,'Service bench · HCMC · IT',1,'Purchased','repair','2020-04-17','2026-02-01',12,'2020-04-17','2023-04-17','[]'),
  ('DEV-1851-OPT','Dell OptiPlex 7020','Desktop','piece','Dell','OptiPlex 7020','DLOPT8','i5-14500 · 16GB · 512GB',88,'HCMC · Floor 1 · Reception',1,'Purchased','in-use','2024-09-20','2026-05-15',12,'2024-09-20','2027-09-20','[]'),
  ('DEV-1860-IMAC','iMac 24 M3','Desktop','piece','Apple','iMac 24','C02ZM4','M3 · 16GB · 512GB',96,'HCMC · Floor 4 · Design pod',1,'Purchased','in-use','2024-11-08','2026-04-20',12,'2024-11-08','2027-11-08','[]'),
  -- Monitors
  ('DEV-3110-U27','Dell U2723QE 27"','Monitor','piece','Dell','U2723QE','MDU272','27" 4K USB-C hub',96,'HCMC · Floor 4 · Desk E-12',2,'Purchased','in-use','2023-09-04','2026-04-02',24,'2023-09-04','2026-09-04','[]'),
  ('DEV-3140-S27','Samsung S27R650','Monitor','piece','Samsung','S27R650','SMS270','27" QHD',78,'HCMC · Floor 3 · Desk D-12',1,'Purchased','in-use','2022-12-01','2026-03-22',24,'2022-12-01','2025-12-01','[]'),
  ('DEV-3155-S32','Samsung Odyssey G7 32"','Monitor','piece','Samsung','Odyssey G7','SMG320','32" QHD curved 240Hz',93,'Hanoi · Floor 2 · Desk S-04',1,'Purchased','storage','2025-01-15','2026-05-09',24,'2025-01-15','2028-01-15','[]'),
  -- Printers
  ('DEV-4501-LJ','HP LaserJet Pro M404','Printer','piece','HP','LaserJet M404','VNB8C1','Mono laser · duplex · network',61,'HCMC · Floor 1 · Print room',1,'Purchased','in-use','2021-11-05','2024-01-09',12,'2021-11-05','2023-11-05','[]'),
  ('DEV-4540-LJ','HP Color LaserJet M555','Printer','piece','HP','Color LaserJet M555','VND9P4','Color laser · A4 · duplex',55,'Hanoi · Floor 1 · Print room',1,'Leased','repair','2022-08-22','2024-09-12','12','2022-08-22','2025-08-22','[]'),
  -- Network gear
  ('DEV-5002-SW','Cisco Catalyst 9200','Network','piece','Cisco','Catalyst 9200','CC9200','24-port PoE+ switch',99,'HCMC · IT closet · Rack A',1,'Purchased','in-use','2023-04-10','2026-04-18',6,'2023-04-10','2028-04-10','[]'),
  ('DEV-5021-RT','Cisco Meraki MX84','Network','piece','Cisco','Meraki MX84','CCMX84','Security appliance · 500 Mbps',97,'HCMC · IT closet · Rack A',1,'Leased','in-use','2024-02-14','2026-04-18',6,'2024-02-14','2027-02-14','[]'),
  -- Servers / NAS
  ('DEV-5210-NAS','Synology RS1221+','Server','piece','Synology','RS1221+','SY1221','8-bay NAS · 32 TB',91,'HCMC · IT closet · Rack B',1,'Purchased','in-use','2023-01-15','2026-04-18',6,'2023-01-15','2026-01-15','[]'),
  ('DEV-5240-NAS','Synology DS1522+','Server','piece','Synology','DS1522+','SY1522','5-bay NAS · 20 TB',45,'Service bench · HCMC · IT',1,'Purchased','repair','2022-03-04','2025-12-28',6,'2022-03-04','2025-03-04','[]'),
  -- Peripherals (cameras / accessories)
  ('DEV-7001-C920','Logitech C920 HD Pro','Peripheral','piece','Logitech','C920','LG920','Full HD webcam',70,'Conference room · HCMC',4,'Purchased','in-use','2022-10-25','2026-02-10',24,'2022-10-25','2024-10-25','[]'),
  ('DEV-7060-MX3','Logitech MX Master 3S','Peripheral','piece','Logitech','MX Master 3S','LGMX3','Wireless mouse',88,'HCMC · Floor 4 · Pool',6,'Purchased','in-use','2024-05-30','2026-04-29',24,'2024-05-30','2026-05-30','[]'),
  ('DEV-7100-MGS','Apple Magic Keyboard','Peripheral','piece','Apple','Magic Keyboard','APMGK','Wireless keyboard with Touch ID',85,'HCMC · Floor 4 · Design pod',3,'Purchased','in-use','2024-07-22','2026-04-29',24,'2024-07-22','2026-07-22','[]'),
  -- Mobile
  ('DEV-6033-IPH','iPhone 15 Pro (test)','Mobile','piece','Apple','iPhone 15 Pro','APIP15','256GB · Natural Ti',82,'Locker · HCMC · IT',1,'Purchased','storage','2024-12-05','2026-03-28',12,'2024-12-05','2025-12-05','[]'),
  ('DEV-6066-PIX','Pixel 8 Pro (test)','Mobile','piece','Samsung','Pixel 8 Pro','GPP8P0','256GB',55,'Service bench · HCMC · IT',1,'Donated','repair','2024-06-30','2025-09-12',12,'2024-06-30','2025-06-30','[]'),
  -- Retired
  ('DEV-9101-RET','Dell Latitude 7280','Laptop','piece','Dell','Latitude 7280','DLLT72','i5-6300U · 8GB · 256GB',12,'Recycle bin · HCMC',1,'Purchased','retired','2017-03-15','2024-09-01',12,'2017-03-15','2020-03-15','[]'),
  ('DEV-9120-RET','HP EliteDesk 800 G3','Desktop','piece','HP','EliteDesk 800 G3','HPED80','i5-7500 · 8GB · 500GB HDD',18,'Recycle bin · HCMC',1,'Purchased','retired','2017-07-22','2024-09-01',12,'2017-07-22','2020-07-22','[]'),
  -- Warranty-expiring soon (next 90d from 2026-06-13)
  ('DEV-2412-XPS','Dell XPS 14 9440','Laptop','piece','Dell','XPS 14 9440','5MR3L9','Ultra 7 · 32GB · 1TB',90,'HCMC · Floor 2 · Desk A-12',1,'Purchased','in-use','2023-07-12','2026-05-20',12,'2023-07-12','2026-07-20','[]'),
  ('DEV-2450-MBP','MacBook Pro 13 M2','Laptop','piece','Apple','MacBook Pro 13','C02PM2','M2 · 16GB · 512GB',86,'HCMC · Floor 3 · Desk B-05',1,'Purchased','in-use','2023-08-08','2026-05-20',12,'2023-08-08','2026-08-08','[]'),
  -- Inventory overdue
  ('DEV-3550-S24','Samsung S24F350 24"','Monitor','piece','Samsung','S24F350','SMS240','24" FHD office',62,'Hanoi · Floor 3 · Desk S-22',1,'Purchased','in-use','2020-05-20','2023-01-12',24,'2020-05-20','2023-05-20','[]'),
  ('DEV-3601-S22','Samsung S22F350 22"','Monitor','piece','Samsung','S22F350','SMS220','22" FHD office',58,'Hanoi · Floor 3 · Desk S-23',1,'Purchased','in-use','2019-09-04','2022-08-10',24,'2019-09-04','2022-09-04','[]')
) as v(code,name,grp,unit_name,mfr,model,serial,specs,condition,location,quantity,source,status,import_date,last_check,cycle,w_start,w_end,photos)
on conflict (code) do nothing;

-- ---- Sample additional users (varied role/status) ----
insert into public.users (name, email, role, status, joined_at, last_active_at) values
  ('Vinh Huynh',     'vinh.huynh@gmail.com',     'admin',  'active',      '2024-01-15', now() - interval '12 minutes'),
  ('Linh Pham',    'linh.pham@gmail.com',    'member', 'active',      '2024-06-04', now() - interval '2 hours'),
  ('Bao Le',       'bao.le@gmail.com',       'member', 'active',      '2025-02-18', now() - interval '3 days'),
  ('Trang Nguyen', 'trang.nguyen@gmail.com', 'member', 'invited',     null,         null),
  ('Hieu Vo',      'hieu.vo@gmail.com',      'member', 'deactivated', '2023-11-09', now() - interval '60 days')
on conflict (email) do nothing;
