create schema if not exists "private";

create type "public"."activity_action" as enum ('insert', 'update', 'delete', 'restore');

create type "public"."device_source" as enum ('Purchased', 'Leased', 'Donated', 'Transferred');

create type "public"."device_status" as enum ('in-use', 'in-storage', 'in-repair', 'retired');

create type "public"."user_role" as enum ('admin', 'member');

create type "public"."user_status" as enum ('active', 'invited', 'disabled');


  create table "public"."activities" (
    "id" uuid not null default gen_random_uuid(),
    "actor_id" uuid,
    "action" public.activity_action not null,
    "entity_type" text not null,
    "entity_id" uuid,
    "entity_label" text,
    "before" jsonb not null default '{}'::jsonb,
    "after" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activities" enable row level security;


  create table "public"."devices" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "group_id" uuid not null,
    "unit_id" uuid not null,
    "manufacturer_id" uuid,
    "model" text,
    "serial_number" text,
    "specifications" text,
    "notes" text,
    "condition" integer not null default 100,
    "location" text,
    "quantity" integer not null default 1,
    "source" public.device_source,
    "status" public.device_status not null default 'in-storage'::public.device_status,
    "import_date" date,
    "last_check_date" date,
    "inventory_cycle_months" integer not null default 12,
    "warranty_start" date,
    "warranty_end" date,
    "photos" jsonb not null default '[]'::jsonb,
    "documents" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."devices" enable row level security;


  create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "icon" text,
    "default_inventory_cycle_months" integer not null default 12,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."groups" enable row level security;


  create table "public"."manufacturers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "support_contact" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."manufacturers" enable row level security;


  create table "public"."units" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "abbreviation" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."units" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "auth_user_id" uuid,
    "name" text not null,
    "email" text not null,
    "phone" text,
    "role" public.user_role not null default 'member'::public.user_role,
    "status" public.user_status not null default 'invited'::public.user_status,
    "joined_at" date,
    "last_active_at" timestamp with time zone,
    "invited_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."users" enable row level security;

CREATE INDEX activities_actor_idx ON public.activities USING btree (actor_id, created_at DESC);

CREATE INDEX activities_created_idx ON public.activities USING btree (created_at DESC);

CREATE INDEX activities_entity_idx ON public.activities USING btree (entity_type, entity_id, created_at DESC);

CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);

CREATE INDEX devices_active_idx ON public.devices USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX devices_code_key ON public.devices USING btree (code);

CREATE INDEX devices_group_idx ON public.devices USING btree (group_id);

CREATE INDEX devices_manufacturer_idx ON public.devices USING btree (manufacturer_id);

CREATE UNIQUE INDEX devices_pkey ON public.devices USING btree (id);

CREATE INDEX devices_status_idx ON public.devices USING btree (status);

CREATE INDEX devices_unit_idx ON public.devices USING btree (unit_id);

CREATE INDEX groups_active_idx ON public.groups USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX groups_name_key ON public.groups USING btree (name);

CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id);

CREATE INDEX manufacturers_active_idx ON public.manufacturers USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX manufacturers_name_key ON public.manufacturers USING btree (name);

CREATE UNIQUE INDEX manufacturers_pkey ON public.manufacturers USING btree (id);

CREATE INDEX units_active_idx ON public.units USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX units_name_key ON public.units USING btree (name);

CREATE UNIQUE INDEX units_pkey ON public.units USING btree (id);

CREATE INDEX users_active_idx ON public.users USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX users_auth_user_id_idx ON public.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_auth_user_id_key ON public.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE INDEX users_role_idx ON public.users USING btree (role);

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."devices" add constraint "devices_pkey" PRIMARY KEY using index "devices_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."manufacturers" add constraint "manufacturers_pkey" PRIMARY KEY using index "manufacturers_pkey";

alter table "public"."units" add constraint "units_pkey" PRIMARY KEY using index "units_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."activities" add constraint "activities_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."activities" validate constraint "activities_actor_id_fkey";

alter table "public"."devices" add constraint "devices_check" CHECK (((warranty_end IS NULL) OR (warranty_start IS NULL) OR (warranty_end >= warranty_start))) not valid;

alter table "public"."devices" validate constraint "devices_check";

alter table "public"."devices" add constraint "devices_code_key" UNIQUE using index "devices_code_key";

alter table "public"."devices" add constraint "devices_condition_check" CHECK (((condition >= 0) AND (condition <= 100))) not valid;

alter table "public"."devices" validate constraint "devices_condition_check";

alter table "public"."devices" add constraint "devices_documents_check" CHECK ((jsonb_typeof(documents) = 'array'::text)) not valid;

alter table "public"."devices" validate constraint "devices_documents_check";

alter table "public"."devices" add constraint "devices_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE RESTRICT not valid;

alter table "public"."devices" validate constraint "devices_group_id_fkey";

alter table "public"."devices" add constraint "devices_inventory_cycle_months_check" CHECK (((inventory_cycle_months >= 1) AND (inventory_cycle_months <= 120))) not valid;

alter table "public"."devices" validate constraint "devices_inventory_cycle_months_check";

alter table "public"."devices" add constraint "devices_manufacturer_id_fkey" FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL not valid;

alter table "public"."devices" validate constraint "devices_manufacturer_id_fkey";

alter table "public"."devices" add constraint "devices_photos_check" CHECK ((jsonb_typeof(photos) = 'array'::text)) not valid;

alter table "public"."devices" validate constraint "devices_photos_check";

alter table "public"."devices" add constraint "devices_quantity_check" CHECK ((quantity >= 1)) not valid;

alter table "public"."devices" validate constraint "devices_quantity_check";

alter table "public"."devices" add constraint "devices_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE RESTRICT not valid;

alter table "public"."devices" validate constraint "devices_unit_id_fkey";

alter table "public"."groups" add constraint "groups_default_inventory_cycle_months_check" CHECK (((default_inventory_cycle_months >= 1) AND (default_inventory_cycle_months <= 120))) not valid;

alter table "public"."groups" validate constraint "groups_default_inventory_cycle_months_check";

alter table "public"."groups" add constraint "groups_name_key" UNIQUE using index "groups_name_key";

alter table "public"."manufacturers" add constraint "manufacturers_name_key" UNIQUE using index "manufacturers_name_key";

alter table "public"."units" add constraint "units_name_key" UNIQUE using index "units_name_key";

alter table "public"."users" add constraint "users_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_auth_user_id_fkey";

alter table "public"."users" add constraint "users_auth_user_id_key" UNIQUE using index "users_auth_user_id_key";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_invited_by_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.log_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  -- v_action is plain text (not public.activity_action) so this file
  -- can be created before activities.sql defines the enum. plpgsql
  -- checks DECLARE'd types eagerly; the cast inside the INSERT below
  -- is resolved at first call, by which time the enum exists.
  v_action     text;
  v_entity_id  uuid;
  v_label_col  text;
  v_label      text;
  v_before     jsonb;
  v_after      jsonb;
begin
  v_action := lower(tg_op);

  if tg_op = 'INSERT' then
    v_before    := '{}'::jsonb;
    v_after     := to_jsonb(new);
    v_entity_id := (new).id;
  elsif tg_op = 'UPDATE' then
    v_before    := to_jsonb(old);
    v_after     := to_jsonb(new);
    v_entity_id := (new).id;
    if (old.deleted_at is not null) and (new.deleted_at is null) then
      v_action := 'restore';
    end if;
  else  -- DELETE (only fires for hard deletes; soft-delete is an UPDATE)
    v_before    := to_jsonb(old);
    v_after     := '{}'::jsonb;
    v_entity_id := (old).id;
  end if;

  v_label_col := coalesce(tg_argv[0], 'name');
  v_label     := coalesce(v_after ->> v_label_col, v_before ->> v_label_col);

  insert into public.activities (
    actor_id, action, entity_type, entity_id, entity_label, before, after
  ) values (
    public.app_user_id(),
    v_action::public.activity_action,
    tg_table_name,
    v_entity_id,
    v_label,
    v_before,
    v_after
  );

  return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.app_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    return null;
  end if;
  return (
    select id
    from public.users
    where auth_user_id = auth.uid()
      and deleted_at is null
    limit 1
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from public.users
    where auth_user_id = auth.uid()
      and role = 'admin'
      and deleted_at is null
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;

grant delete on table "public"."activities" to "anon";

grant insert on table "public"."activities" to "anon";

grant references on table "public"."activities" to "anon";

grant select on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant update on table "public"."activities" to "anon";

grant delete on table "public"."activities" to "authenticated";

grant insert on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "authenticated";

grant select on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant update on table "public"."activities" to "authenticated";

grant delete on table "public"."activities" to "service_role";

grant insert on table "public"."activities" to "service_role";

grant references on table "public"."activities" to "service_role";

grant select on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant update on table "public"."activities" to "service_role";

grant delete on table "public"."devices" to "anon";

grant insert on table "public"."devices" to "anon";

grant references on table "public"."devices" to "anon";

grant select on table "public"."devices" to "anon";

grant trigger on table "public"."devices" to "anon";

grant truncate on table "public"."devices" to "anon";

grant update on table "public"."devices" to "anon";

grant delete on table "public"."devices" to "authenticated";

grant insert on table "public"."devices" to "authenticated";

grant references on table "public"."devices" to "authenticated";

grant select on table "public"."devices" to "authenticated";

grant trigger on table "public"."devices" to "authenticated";

grant truncate on table "public"."devices" to "authenticated";

grant update on table "public"."devices" to "authenticated";

grant delete on table "public"."devices" to "service_role";

grant insert on table "public"."devices" to "service_role";

grant references on table "public"."devices" to "service_role";

grant select on table "public"."devices" to "service_role";

grant trigger on table "public"."devices" to "service_role";

grant truncate on table "public"."devices" to "service_role";

grant update on table "public"."devices" to "service_role";

grant delete on table "public"."groups" to "anon";

grant insert on table "public"."groups" to "anon";

grant references on table "public"."groups" to "anon";

grant select on table "public"."groups" to "anon";

grant trigger on table "public"."groups" to "anon";

grant truncate on table "public"."groups" to "anon";

grant update on table "public"."groups" to "anon";

grant delete on table "public"."groups" to "authenticated";

grant insert on table "public"."groups" to "authenticated";

grant references on table "public"."groups" to "authenticated";

grant select on table "public"."groups" to "authenticated";

grant trigger on table "public"."groups" to "authenticated";

grant truncate on table "public"."groups" to "authenticated";

grant update on table "public"."groups" to "authenticated";

grant delete on table "public"."groups" to "service_role";

grant insert on table "public"."groups" to "service_role";

grant references on table "public"."groups" to "service_role";

grant select on table "public"."groups" to "service_role";

grant trigger on table "public"."groups" to "service_role";

grant truncate on table "public"."groups" to "service_role";

grant update on table "public"."groups" to "service_role";

grant delete on table "public"."manufacturers" to "anon";

grant insert on table "public"."manufacturers" to "anon";

grant references on table "public"."manufacturers" to "anon";

grant select on table "public"."manufacturers" to "anon";

grant trigger on table "public"."manufacturers" to "anon";

grant truncate on table "public"."manufacturers" to "anon";

grant update on table "public"."manufacturers" to "anon";

grant delete on table "public"."manufacturers" to "authenticated";

grant insert on table "public"."manufacturers" to "authenticated";

grant references on table "public"."manufacturers" to "authenticated";

grant select on table "public"."manufacturers" to "authenticated";

grant trigger on table "public"."manufacturers" to "authenticated";

grant truncate on table "public"."manufacturers" to "authenticated";

grant update on table "public"."manufacturers" to "authenticated";

grant delete on table "public"."manufacturers" to "service_role";

grant insert on table "public"."manufacturers" to "service_role";

grant references on table "public"."manufacturers" to "service_role";

grant select on table "public"."manufacturers" to "service_role";

grant trigger on table "public"."manufacturers" to "service_role";

grant truncate on table "public"."manufacturers" to "service_role";

grant update on table "public"."manufacturers" to "service_role";

grant delete on table "public"."units" to "anon";

grant insert on table "public"."units" to "anon";

grant references on table "public"."units" to "anon";

grant select on table "public"."units" to "anon";

grant trigger on table "public"."units" to "anon";

grant truncate on table "public"."units" to "anon";

grant update on table "public"."units" to "anon";

grant delete on table "public"."units" to "authenticated";

grant insert on table "public"."units" to "authenticated";

grant references on table "public"."units" to "authenticated";

grant select on table "public"."units" to "authenticated";

grant trigger on table "public"."units" to "authenticated";

grant truncate on table "public"."units" to "authenticated";

grant update on table "public"."units" to "authenticated";

grant delete on table "public"."units" to "service_role";

grant insert on table "public"."units" to "service_role";

grant references on table "public"."units" to "service_role";

grant select on table "public"."units" to "service_role";

grant trigger on table "public"."units" to "service_role";

grant truncate on table "public"."units" to "service_role";

grant update on table "public"."units" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "activities_read"
  on "public"."activities"
  as permissive
  for select
  to authenticated
using (true);



  create policy "devices_delete"
  on "public"."devices"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "devices_insert"
  on "public"."devices"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "devices_read"
  on "public"."devices"
  as permissive
  for select
  to authenticated
using (true);



  create policy "devices_update"
  on "public"."devices"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "groups_delete"
  on "public"."groups"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "groups_insert"
  on "public"."groups"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "groups_read"
  on "public"."groups"
  as permissive
  for select
  to authenticated
using (true);



  create policy "groups_update"
  on "public"."groups"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "manufacturers_delete"
  on "public"."manufacturers"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "manufacturers_insert"
  on "public"."manufacturers"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "manufacturers_read"
  on "public"."manufacturers"
  as permissive
  for select
  to authenticated
using (true);



  create policy "manufacturers_update"
  on "public"."manufacturers"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "units_delete"
  on "public"."units"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "units_insert"
  on "public"."units"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "units_read"
  on "public"."units"
  as permissive
  for select
  to authenticated
using (true);



  create policy "units_update"
  on "public"."units"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "users_delete"
  on "public"."users"
  as permissive
  for delete
  to authenticated
using (public.is_admin());



  create policy "users_insert"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check (public.is_admin());



  create policy "users_read"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (true);



  create policy "users_update"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((public.is_admin() OR (auth_user_id = ( SELECT auth.uid() AS uid))))
with check ((public.is_admin() OR ((auth_user_id = ( SELECT auth.uid() AS uid)) AND (role = ( SELECT u.role
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))) AND (status = ( SELECT u.status
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid)))) AND (NOT (auth_user_id IS DISTINCT FROM ( SELECT u.auth_user_id
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (invited_by IS DISTINCT FROM ( SELECT u.invited_by
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))) AND (NOT (deleted_at IS DISTINCT FROM ( SELECT u.deleted_at
   FROM public.users u
  WHERE (u.auth_user_id = ( SELECT auth.uid() AS uid))))))));


CREATE TRIGGER devices_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER devices_set_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER groups_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER groups_set_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER manufacturers_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.manufacturers FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER manufacturers_set_updated_at BEFORE UPDATE ON public.manufacturers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER units_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER units_set_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER users_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION private.log_activity('email');

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


  create policy "authenticated delete device files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text])));



  create policy "authenticated read device files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text])));



  create policy "authenticated update device files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text])))
with check ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text])));



  create policy "authenticated write device files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = ANY (ARRAY['device-photos'::text, 'device-documents'::text])));



