create type "public"."device_unit" as enum ('piece', 'set', 'unit', 'box', 'item');

drop trigger if exists "units_log_activity" on "public"."units";

drop trigger if exists "units_set_updated_at" on "public"."units";

drop policy "units_delete" on "public"."units";

drop policy "units_insert" on "public"."units";

drop policy "units_read" on "public"."units";

drop policy "units_update" on "public"."units";

revoke delete on table "public"."units" from "authenticated";

revoke insert on table "public"."units" from "authenticated";

revoke references on table "public"."units" from "authenticated";

revoke select on table "public"."units" from "authenticated";

revoke trigger on table "public"."units" from "authenticated";

revoke truncate on table "public"."units" from "authenticated";

revoke update on table "public"."units" from "authenticated";

revoke delete on table "public"."units" from "service_role";

revoke insert on table "public"."units" from "service_role";

revoke references on table "public"."units" from "service_role";

revoke select on table "public"."units" from "service_role";

revoke trigger on table "public"."units" from "service_role";

revoke truncate on table "public"."units" from "service_role";

revoke update on table "public"."units" from "service_role";

alter table "public"."devices" drop constraint "devices_code_key";

alter table "public"."devices" drop constraint "devices_unit_id_fkey";

alter table "public"."units" drop constraint "units_name_key";

alter table "public"."units" drop constraint "units_pkey";

drop index if exists "public"."devices_code_key";

drop index if exists "public"."devices_unit_idx";

drop index if exists "public"."units_active_idx";

drop index if exists "public"."units_name_key";

drop index if exists "public"."units_pkey";

drop table "public"."units";

alter table "public"."devices" drop column "unit_id";

alter table "public"."devices" add column "unit" public.device_unit not null default 'piece'::public.device_unit;


