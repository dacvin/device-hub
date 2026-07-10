create type "public"."device_source" as enum ('Purchased', 'Leased', 'Donated', 'Transferred');

create type "public"."device_status" as enum ('in-use', 'storage', 'repair', 'retired');

drop view if exists "public"."users_with_activity";


  create table "public"."devices" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "group_id" uuid not null,
    "unit_id" uuid not null,
    "manufacturer_id" uuid not null,
    "model" text,
    "serial_number" text,
    "specifications" text,
    "notes" text,
    "condition" integer not null default 100,
    "location" text,
    "quantity" integer not null default 1,
    "source" public.device_source,
    "status" public.device_status not null default 'storage'::public.device_status,
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
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone
      );


alter table "public"."units" enable row level security;

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

alter table "public"."devices" add constraint "devices_pkey" PRIMARY KEY using index "devices_pkey";

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";

alter table "public"."manufacturers" add constraint "manufacturers_pkey" PRIMARY KEY using index "manufacturers_pkey";

alter table "public"."units" add constraint "units_pkey" PRIMARY KEY using index "units_pkey";

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

alter table "public"."devices" add constraint "devices_manufacturer_id_fkey" FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE RESTRICT not valid;

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


CREATE TRIGGER devices_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER devices_set_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER groups_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER groups_set_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER manufacturers_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.manufacturers FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER manufacturers_set_updated_at BEFORE UPDATE ON public.manufacturers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER units_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION private.log_activity('name');

CREATE TRIGGER units_set_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


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



