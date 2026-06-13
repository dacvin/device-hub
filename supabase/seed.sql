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
      crypt('password123', gen_salt('bf')),
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
  ('DEV-2041-XPS','Dell XPS 15 9530','Laptop','piece','Dell','XPS 15 9530','5KQ8R2','Intel i7-13700H · 32GB · 1TB SSD · RTX 4050',92,'HCMC · Floor 4 · Desk E-12',1,'Purchased','in-use','2023-08-14','2025-03-02',12,'2023-08-14','2026-08-14','[{"path":"DEV-2041-XPS.png","file_name":"DEV-2041-XPS.png","sort_order":0}]'),
  ('DEV-2088-MBP','MacBook Pro 14 M3','Laptop','piece','Apple','MacBook Pro 14','C02XR3','Apple M3 Pro · 36GB · 1TB SSD',88,'HCMC · Floor 3 · Desk D-04',1,'Purchased','in-use','2024-01-20','2026-04-11',12,'2024-01-20','2027-01-20','[{"path":"DEV-2088-MBP.png","file_name":"DEV-2088-MBP.png","sort_order":0}]'),
  ('DEV-1903-T14','ThinkPad T14 Gen 4','Laptop','piece','Lenovo','ThinkPad T14','PF3K9A','AMD Ryzen 7 · 16GB · 512GB SSD',74,'Hanoi · Floor 2 · Desk S-21',1,'Leased','in-use','2022-06-30','2026-03-18',12,'2022-06-30','2025-06-30','[]'),
  ('DEV-4501-LJ','HP LaserJet Pro M404','Printer','piece','HP','LaserJet M404','VNB8C1','Mono laser · duplex · network',61,'HCMC · Floor 1 · Print room',1,'Purchased','in-use','2021-11-05','2024-01-09',12,'2021-11-05','2023-11-05','[]'),
  ('DEV-1850-OPT','Dell OptiPlex 7010','Desktop','piece','Dell','OptiPlex 7010','DLOPT7','i5-13500 · 16GB · 512GB — PSU fault, awaiting part',34,'Service bench · HCMC · IT',1,'Purchased','in-repair','2020-04-17','2026-02-01',12,'2020-04-17','2023-04-17','[]')
) as v(code,name,grp,unit_name,mfr,model,serial,specs,condition,location,quantity,source,status,import_date,last_check,cycle,w_start,w_end,photos)
on conflict (code) do nothing;
