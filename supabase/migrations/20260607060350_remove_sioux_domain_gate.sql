alter table "public"."org_settings" alter column "org_name" set default 'DeviceHub'::text;

-- Update the existing singleton row if it still holds the prior placeholder.
update "public"."org_settings" set org_name = 'DeviceHub' where org_name = 'Sioux Asia';


