create type "public"."activity_action" as enum ('device.created', 'device.updated', 'device.status_changed', 'device.deleted', 'device.restored', 'device.inventory_checked', 'device.allocated', 'member.invited', 'member.role_changed', 'member.removed', 'catalog.created', 'catalog.updated', 'catalog.deleted', 'settings.updated');

create type "public"."member_role" as enum ('it_admin', 'manager', 'viewer');

create type "public"."member_status" as enum ('active', 'invited', 'disabled');

drop policy "authenticated_delete_department" on "public"."department";

drop policy "authenticated_insert_department" on "public"."department";

drop policy "authenticated_select_department" on "public"."department";

drop policy "authenticated_update_department" on "public"."department";

drop policy "authenticated_delete_device" on "public"."device";

drop policy "authenticated_insert_device" on "public"."device";

drop policy "authenticated_select_device" on "public"."device";

drop policy "authenticated_update_device" on "public"."device";

drop policy "authenticated_delete_device_document" on "public"."device_document";

drop policy "authenticated_insert_device_document" on "public"."device_document";

drop policy "authenticated_select_device_document" on "public"."device_document";

drop policy "authenticated_update_device_document" on "public"."device_document";

drop policy "authenticated_delete_device_group" on "public"."device_group";

drop policy "authenticated_insert_device_group" on "public"."device_group";

drop policy "authenticated_select_device_group" on "public"."device_group";

drop policy "authenticated_update_device_group" on "public"."device_group";

drop policy "authenticated_delete_device_photo" on "public"."device_photo";

drop policy "authenticated_insert_device_photo" on "public"."device_photo";

drop policy "authenticated_select_device_photo" on "public"."device_photo";

drop policy "authenticated_update_device_photo" on "public"."device_photo";

drop policy "authenticated_delete_manufacturer" on "public"."manufacturer";

drop policy "authenticated_insert_manufacturer" on "public"."manufacturer";

drop policy "authenticated_select_manufacturer" on "public"."manufacturer";

drop policy "authenticated_update_manufacturer" on "public"."manufacturer";

drop view if exists "public"."device_with_flags";


  create table "public"."activity" (
    "id" uuid not null default gen_random_uuid(),
    "actor_id" uuid,
    "action" public.activity_action not null,
    "entity_type" text not null,
    "entity_id" uuid,
    "entity_label" text,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activity" enable row level security;


  create table "public"."member" (
    "id" uuid not null,
    "name" text not null,
    "email" text not null,
    "role" public.member_role not null default 'viewer'::public.member_role,
    "status" public.member_status not null default 'invited'::public.member_status,
    "department_id" uuid,
    "site" text,
    "phone" text,
    "reports_to" uuid,
    "joined_at" date,
    "last_active_at" timestamp with time zone,
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."member" enable row level security;


  create table "public"."org_settings" (
    "id" boolean not null default true,
    "org_name" text not null default 'Sioux Asia'::text,
    "primary_site" text,
    "date_format" text not null default 'DD MMM YYYY'::text,
    "code_prefix" text not null default 'DEV-'::text,
    "code_autogenerate" boolean not null default true,
    "default_inventory_cycle_months" integer not null default 12,
    "condition_good_pct" integer not null default 70,
    "condition_fair_pct" integer not null default 40,
    "warranty_expiring_days" integer not null default 90,
    "notify_warranty" boolean not null default true,
    "notify_inventory_overdue" boolean not null default true,
    "notify_weekly_summary" boolean not null default true,
    "notify_new_device" boolean not null default false,
    "export_format" text not null default 'CSV'::text,
    "deleted_retention_days" integer not null default 30,
    "updated_by" uuid,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."org_settings" enable row level security;


  create table "public"."user_preference" (
    "user_id" uuid not null,
    "theme" text not null default 'system'::text,
    "default_device_view" text not null default 'table'::text,
    "mono_codes" boolean not null default true,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."user_preference" enable row level security;

CREATE INDEX activity_actor_idx ON public.activity USING btree (actor_id, created_at DESC);

CREATE INDEX activity_created_idx ON public.activity USING btree (created_at DESC);

CREATE INDEX activity_entity_idx ON public.activity USING btree (entity_type, entity_id, created_at DESC);

CREATE UNIQUE INDEX activity_pkey ON public.activity USING btree (id);

CREATE INDEX member_department_idx ON public.member USING btree (department_id);

CREATE UNIQUE INDEX member_email_key ON public.member USING btree (email);

CREATE UNIQUE INDEX member_pkey ON public.member USING btree (id);

CREATE INDEX member_role_idx ON public.member USING btree (role);

CREATE UNIQUE INDEX org_settings_pkey ON public.org_settings USING btree (id);

CREATE UNIQUE INDEX user_preference_pkey ON public.user_preference USING btree (user_id);

alter table "public"."activity" add constraint "activity_pkey" PRIMARY KEY using index "activity_pkey";

alter table "public"."member" add constraint "member_pkey" PRIMARY KEY using index "member_pkey";

alter table "public"."org_settings" add constraint "org_settings_pkey" PRIMARY KEY using index "org_settings_pkey";

alter table "public"."user_preference" add constraint "user_preference_pkey" PRIMARY KEY using index "user_preference_pkey";

alter table "public"."activity" add constraint "activity_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.member(id) ON DELETE SET NULL not valid;

alter table "public"."activity" validate constraint "activity_actor_id_fkey";

alter table "public"."member" add constraint "member_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE SET NULL not valid;

alter table "public"."member" validate constraint "member_department_id_fkey";

alter table "public"."member" add constraint "member_email_key" UNIQUE using index "member_email_key";

alter table "public"."member" add constraint "member_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES public.member(id) ON DELETE SET NULL not valid;

alter table "public"."member" validate constraint "member_invited_by_fkey";

alter table "public"."member" add constraint "member_reports_to_fkey" FOREIGN KEY (reports_to) REFERENCES public.member(id) ON DELETE SET NULL not valid;

alter table "public"."member" validate constraint "member_reports_to_fkey";

alter table "public"."org_settings" add constraint "org_settings_check" CHECK ((condition_fair_pct <= condition_good_pct)) not valid;

alter table "public"."org_settings" validate constraint "org_settings_check";

alter table "public"."org_settings" add constraint "org_settings_condition_fair_pct_check" CHECK (((condition_fair_pct >= 0) AND (condition_fair_pct <= 100))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_condition_fair_pct_check";

alter table "public"."org_settings" add constraint "org_settings_condition_good_pct_check" CHECK (((condition_good_pct >= 0) AND (condition_good_pct <= 100))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_condition_good_pct_check";

alter table "public"."org_settings" add constraint "org_settings_default_inventory_cycle_months_check" CHECK (((default_inventory_cycle_months >= 1) AND (default_inventory_cycle_months <= 120))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_default_inventory_cycle_months_check";

alter table "public"."org_settings" add constraint "org_settings_deleted_retention_days_check" CHECK (((deleted_retention_days >= 0) AND (deleted_retention_days <= 3650))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_deleted_retention_days_check";

alter table "public"."org_settings" add constraint "org_settings_export_format_check" CHECK ((export_format = ANY (ARRAY['CSV'::text, 'XLSX'::text, 'PDF'::text]))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_export_format_check";

alter table "public"."org_settings" add constraint "org_settings_id_check" CHECK (id) not valid;

alter table "public"."org_settings" validate constraint "org_settings_id_check";

alter table "public"."org_settings" add constraint "org_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES public.member(id) ON DELETE SET NULL not valid;

alter table "public"."org_settings" validate constraint "org_settings_updated_by_fkey";

alter table "public"."org_settings" add constraint "org_settings_warranty_expiring_days_check" CHECK (((warranty_expiring_days >= 1) AND (warranty_expiring_days <= 365))) not valid;

alter table "public"."org_settings" validate constraint "org_settings_warranty_expiring_days_check";

alter table "public"."user_preference" add constraint "user_preference_default_device_view_check" CHECK ((default_device_view = ANY (ARRAY['table'::text, 'cards'::text]))) not valid;

alter table "public"."user_preference" validate constraint "user_preference_default_device_view_check";

alter table "public"."user_preference" add constraint "user_preference_theme_check" CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))) not valid;

alter table "public"."user_preference" validate constraint "user_preference_theme_check";

alter table "public"."user_preference" add constraint "user_preference_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.member(id) ON DELETE CASCADE not valid;

alter table "public"."user_preference" validate constraint "user_preference_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.app_dept()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select department_id from member where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.app_role()
 RETURNS public.member_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from member where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.devices_with_flags(p_warranty_days integer DEFAULT 90)
 RETURNS TABLE(id uuid, code text, name text, group_id uuid, department_id uuid, manufacturer_id uuid, model text, serial_number text, specifications text, notes text, condition integer, location text, quantity integer, unit public.unit, source public.device_source, import_date date, last_check_date date, inventory_cycle_months integer, warranty_start date, warranty_end date, status public.device_status, cover_photo_id uuid, deleted_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, flag_warranty_expiring boolean, flag_inventory_overdue boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select d.*,
    (d.status <> 'retired'
     and d.warranty_end is not null
     and d.warranty_end >= current_date
     and d.warranty_end <= current_date + (p_warranty_days || ' days')::interval) as flag_warranty_expiring,
    (d.status <> 'retired'
     and d.last_check_date is not null
     and d.last_check_date < current_date
         - (d.inventory_cycle_months || ' months')::interval)                     as flag_inventory_overdue
  from device d;
$function$
;

CREATE OR REPLACE FUNCTION public.member_role_label(r public.member_role)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case r
    when 'it_admin' then 'IT Admin'
    when 'manager'  then 'Manager'
    when 'viewer'   then 'Viewer'
  end;
$function$
;

grant delete on table "public"."activity" to "anon";

grant insert on table "public"."activity" to "anon";

grant references on table "public"."activity" to "anon";

grant select on table "public"."activity" to "anon";

grant trigger on table "public"."activity" to "anon";

grant truncate on table "public"."activity" to "anon";

grant update on table "public"."activity" to "anon";

grant delete on table "public"."activity" to "authenticated";

grant insert on table "public"."activity" to "authenticated";

grant references on table "public"."activity" to "authenticated";

grant select on table "public"."activity" to "authenticated";

grant trigger on table "public"."activity" to "authenticated";

grant truncate on table "public"."activity" to "authenticated";

grant update on table "public"."activity" to "authenticated";

grant delete on table "public"."activity" to "service_role";

grant insert on table "public"."activity" to "service_role";

grant references on table "public"."activity" to "service_role";

grant select on table "public"."activity" to "service_role";

grant trigger on table "public"."activity" to "service_role";

grant truncate on table "public"."activity" to "service_role";

grant update on table "public"."activity" to "service_role";

grant delete on table "public"."member" to "anon";

grant insert on table "public"."member" to "anon";

grant references on table "public"."member" to "anon";

grant select on table "public"."member" to "anon";

grant trigger on table "public"."member" to "anon";

grant truncate on table "public"."member" to "anon";

grant update on table "public"."member" to "anon";

grant delete on table "public"."member" to "authenticated";

grant insert on table "public"."member" to "authenticated";

grant references on table "public"."member" to "authenticated";

grant select on table "public"."member" to "authenticated";

grant trigger on table "public"."member" to "authenticated";

grant truncate on table "public"."member" to "authenticated";

grant update on table "public"."member" to "authenticated";

grant delete on table "public"."member" to "service_role";

grant insert on table "public"."member" to "service_role";

grant references on table "public"."member" to "service_role";

grant select on table "public"."member" to "service_role";

grant trigger on table "public"."member" to "service_role";

grant truncate on table "public"."member" to "service_role";

grant update on table "public"."member" to "service_role";

grant delete on table "public"."org_settings" to "anon";

grant insert on table "public"."org_settings" to "anon";

grant references on table "public"."org_settings" to "anon";

grant select on table "public"."org_settings" to "anon";

grant trigger on table "public"."org_settings" to "anon";

grant truncate on table "public"."org_settings" to "anon";

grant update on table "public"."org_settings" to "anon";

grant delete on table "public"."org_settings" to "authenticated";

grant insert on table "public"."org_settings" to "authenticated";

grant references on table "public"."org_settings" to "authenticated";

grant select on table "public"."org_settings" to "authenticated";

grant trigger on table "public"."org_settings" to "authenticated";

grant truncate on table "public"."org_settings" to "authenticated";

grant update on table "public"."org_settings" to "authenticated";

grant delete on table "public"."org_settings" to "service_role";

grant insert on table "public"."org_settings" to "service_role";

grant references on table "public"."org_settings" to "service_role";

grant select on table "public"."org_settings" to "service_role";

grant trigger on table "public"."org_settings" to "service_role";

grant truncate on table "public"."org_settings" to "service_role";

grant update on table "public"."org_settings" to "service_role";

grant delete on table "public"."user_preference" to "anon";

grant insert on table "public"."user_preference" to "anon";

grant references on table "public"."user_preference" to "anon";

grant select on table "public"."user_preference" to "anon";

grant trigger on table "public"."user_preference" to "anon";

grant truncate on table "public"."user_preference" to "anon";

grant update on table "public"."user_preference" to "anon";

grant delete on table "public"."user_preference" to "authenticated";

grant insert on table "public"."user_preference" to "authenticated";

grant references on table "public"."user_preference" to "authenticated";

grant select on table "public"."user_preference" to "authenticated";

grant trigger on table "public"."user_preference" to "authenticated";

grant truncate on table "public"."user_preference" to "authenticated";

grant update on table "public"."user_preference" to "authenticated";

grant delete on table "public"."user_preference" to "service_role";

grant insert on table "public"."user_preference" to "service_role";

grant references on table "public"."user_preference" to "service_role";

grant select on table "public"."user_preference" to "service_role";

grant trigger on table "public"."user_preference" to "service_role";

grant truncate on table "public"."user_preference" to "service_role";

grant update on table "public"."user_preference" to "service_role";


  create policy "activity_read_all"
  on "public"."activity"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "department_read"
  on "public"."department"
  as permissive
  for select
  to public
using (true);



  create policy "department_write_admin"
  on "public"."department"
  as permissive
  for all
  to public
using ((public.app_role() = 'it_admin'::public.member_role))
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "device_read"
  on "public"."device"
  as permissive
  for select
  to public
using (true);



  create policy "device_write"
  on "public"."device"
  as permissive
  for all
  to public
using (((public.app_role() = 'it_admin'::public.member_role) OR ((public.app_role() = 'manager'::public.member_role) AND (department_id = public.app_dept()))))
with check (((public.app_role() = 'it_admin'::public.member_role) OR ((public.app_role() = 'manager'::public.member_role) AND (department_id = public.app_dept()))));



  create policy "device_document_read"
  on "public"."device_document"
  as permissive
  for select
  to public
using (true);



  create policy "device_document_write"
  on "public"."device_document"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.device d
  WHERE ((d.id = device_document.device_id) AND ((public.app_role() = 'it_admin'::public.member_role) OR ((public.app_role() = 'manager'::public.member_role) AND (d.department_id = public.app_dept())))))));



  create policy "device_group_read"
  on "public"."device_group"
  as permissive
  for select
  to public
using (true);



  create policy "device_group_write_admin"
  on "public"."device_group"
  as permissive
  for all
  to public
using ((public.app_role() = 'it_admin'::public.member_role))
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "device_photo_read"
  on "public"."device_photo"
  as permissive
  for select
  to public
using (true);



  create policy "device_photo_write"
  on "public"."device_photo"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.device d
  WHERE ((d.id = device_photo.device_id) AND ((public.app_role() = 'it_admin'::public.member_role) OR ((public.app_role() = 'manager'::public.member_role) AND (d.department_id = public.app_dept())))))));



  create policy "manufacturer_read"
  on "public"."manufacturer"
  as permissive
  for select
  to public
using (true);



  create policy "manufacturer_write_admin"
  on "public"."manufacturer"
  as permissive
  for all
  to public
using ((public.app_role() = 'it_admin'::public.member_role))
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "member_delete_admin"
  on "public"."member"
  as permissive
  for delete
  to public
using ((public.app_role() = 'it_admin'::public.member_role));



  create policy "member_read_all"
  on "public"."member"
  as permissive
  for select
  to public
using (true);



  create policy "member_update_admin"
  on "public"."member"
  as permissive
  for update
  to public
using ((public.app_role() = 'it_admin'::public.member_role))
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "member_update_self"
  on "public"."member"
  as permissive
  for update
  to public
using ((id = auth.uid()))
with check ((id = auth.uid()));



  create policy "member_write_admin"
  on "public"."member"
  as permissive
  for insert
  to public
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "org_settings_read"
  on "public"."org_settings"
  as permissive
  for select
  to public
using (true);



  create policy "org_settings_write"
  on "public"."org_settings"
  as permissive
  for update
  to public
using ((public.app_role() = 'it_admin'::public.member_role))
with check ((public.app_role() = 'it_admin'::public.member_role));



  create policy "user_pref_self_insert"
  on "public"."user_preference"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "user_pref_self_read"
  on "public"."user_preference"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "user_pref_self_update"
  on "public"."user_preference"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



