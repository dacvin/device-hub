create type "public"."device_source" as enum ('Purchased', 'Leased', 'Donated', 'Transferred');

create type "public"."device_status" as enum ('in-use', 'in-storage', 'in-repair', 'retired');

create type "public"."unit" as enum ('piece', 'set', 'box');


  create table "public"."department" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "manager" text,
    "primary_location" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."department" enable row level security;


  create table "public"."device" (
    "id" uuid not null default gen_random_uuid(),
    "code" text not null,
    "name" text not null,
    "group_id" uuid not null,
    "department_id" uuid not null,
    "manufacturer_id" uuid,
    "model" text,
    "serial_number" text,
    "specifications" text,
    "notes" text,
    "condition" integer not null default 100,
    "location" text,
    "quantity" integer not null default 1,
    "unit" public.unit not null default 'piece'::public.unit,
    "source" public.device_source,
    "import_date" date,
    "last_check_date" date,
    "inventory_cycle_months" integer not null default 12,
    "warranty_start" date,
    "warranty_end" date,
    "status" public.device_status not null default 'in-storage'::public.device_status,
    "cover_photo_id" uuid,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."device" enable row level security;


  create table "public"."device_document" (
    "id" uuid not null default gen_random_uuid(),
    "device_id" uuid not null,
    "url" text not null,
    "file_name" text not null,
    "mime_type" text,
    "size_bytes" bigint,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."device_document" enable row level security;


  create table "public"."device_group" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "icon" text,
    "default_inventory_cycle_months" integer not null default 12,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."device_group" enable row level security;


  create table "public"."device_photo" (
    "id" uuid not null default gen_random_uuid(),
    "device_id" uuid not null,
    "url" text not null,
    "file_name" text,
    "size_bytes" bigint,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."device_photo" enable row level security;


  create table "public"."manufacturer" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "support_contact" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."manufacturer" enable row level security;

CREATE UNIQUE INDEX department_name_key ON public.department USING btree (name);

CREATE UNIQUE INDEX department_pkey ON public.department USING btree (id);

CREATE INDEX device_active_idx ON public.device USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX device_code_key ON public.device USING btree (code);

CREATE INDEX device_department_idx ON public.device USING btree (department_id);

CREATE INDEX device_document_device_idx ON public.device_document USING btree (device_id);

CREATE UNIQUE INDEX device_document_pkey ON public.device_document USING btree (id);

CREATE INDEX device_group_idx ON public.device USING btree (group_id);

CREATE UNIQUE INDEX device_group_name_key ON public.device_group USING btree (name);

CREATE UNIQUE INDEX device_group_pkey ON public.device_group USING btree (id);

CREATE INDEX device_manufacturer_idx ON public.device USING btree (manufacturer_id);

CREATE INDEX device_photo_device_idx ON public.device_photo USING btree (device_id, sort_order);

CREATE UNIQUE INDEX device_photo_pkey ON public.device_photo USING btree (id);

CREATE UNIQUE INDEX device_pkey ON public.device USING btree (id);

CREATE UNIQUE INDEX manufacturer_name_key ON public.manufacturer USING btree (name);

CREATE UNIQUE INDEX manufacturer_pkey ON public.manufacturer USING btree (id);

alter table "public"."department" add constraint "department_pkey" PRIMARY KEY using index "department_pkey";

alter table "public"."device" add constraint "device_pkey" PRIMARY KEY using index "device_pkey";

alter table "public"."device_document" add constraint "device_document_pkey" PRIMARY KEY using index "device_document_pkey";

alter table "public"."device_group" add constraint "device_group_pkey" PRIMARY KEY using index "device_group_pkey";

alter table "public"."device_photo" add constraint "device_photo_pkey" PRIMARY KEY using index "device_photo_pkey";

alter table "public"."manufacturer" add constraint "manufacturer_pkey" PRIMARY KEY using index "manufacturer_pkey";

alter table "public"."department" add constraint "department_name_key" UNIQUE using index "department_name_key";

alter table "public"."device" add constraint "device_check" CHECK (((warranty_end IS NULL) OR (warranty_start IS NULL) OR (warranty_end >= warranty_start))) not valid;

alter table "public"."device" validate constraint "device_check";

alter table "public"."device" add constraint "device_code_key" UNIQUE using index "device_code_key";

alter table "public"."device" add constraint "device_condition_check" CHECK (((condition >= 0) AND (condition <= 100))) not valid;

alter table "public"."device" validate constraint "device_condition_check";

alter table "public"."device" add constraint "device_cover_photo_fk" FOREIGN KEY (cover_photo_id) REFERENCES public.device_photo(id) ON DELETE SET NULL not valid;

alter table "public"."device" validate constraint "device_cover_photo_fk";

alter table "public"."device" add constraint "device_department_id_fkey" FOREIGN KEY (department_id) REFERENCES public.department(id) ON DELETE RESTRICT not valid;

alter table "public"."device" validate constraint "device_department_id_fkey";

alter table "public"."device" add constraint "device_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.device_group(id) ON DELETE RESTRICT not valid;

alter table "public"."device" validate constraint "device_group_id_fkey";

alter table "public"."device" add constraint "device_manufacturer_id_fkey" FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturer(id) ON DELETE SET NULL not valid;

alter table "public"."device" validate constraint "device_manufacturer_id_fkey";

alter table "public"."device" add constraint "device_quantity_check" CHECK ((quantity >= 1)) not valid;

alter table "public"."device" validate constraint "device_quantity_check";

alter table "public"."device_document" add constraint "device_document_device_id_fkey" FOREIGN KEY (device_id) REFERENCES public.device(id) ON DELETE CASCADE not valid;

alter table "public"."device_document" validate constraint "device_document_device_id_fkey";

alter table "public"."device_group" add constraint "device_group_name_key" UNIQUE using index "device_group_name_key";

alter table "public"."device_photo" add constraint "device_photo_device_id_fkey" FOREIGN KEY (device_id) REFERENCES public.device(id) ON DELETE CASCADE not valid;

alter table "public"."device_photo" validate constraint "device_photo_device_id_fkey";

alter table "public"."device_photo" add constraint "device_photo_size_bytes_check" CHECK (((size_bytes IS NULL) OR (size_bytes <= 5242880))) not valid;

alter table "public"."device_photo" validate constraint "device_photo_size_bytes_check";

alter table "public"."manufacturer" add constraint "manufacturer_name_key" UNIQUE using index "manufacturer_name_key";

set check_function_bodies = off;

create or replace view "public"."device_with_flags" as  SELECT id,
    code,
    name,
    group_id,
    department_id,
    manufacturer_id,
    model,
    serial_number,
    specifications,
    notes,
    condition,
    location,
    quantity,
    unit,
    source,
    import_date,
    last_check_date,
    inventory_cycle_months,
    warranty_start,
    warranty_end,
    status,
    cover_photo_id,
    deleted_at,
    created_at,
    updated_at,
    ((status <> 'retired'::public.device_status) AND (warranty_end IS NOT NULL) AND (warranty_end >= CURRENT_DATE) AND (warranty_end <= (CURRENT_DATE + '90 days'::interval))) AS flag_warranty_expiring,
    ((status <> 'retired'::public.device_status) AND (last_check_date IS NOT NULL) AND (last_check_date < (CURRENT_DATE - ((inventory_cycle_months || ' months'::text))::interval))) AS flag_inventory_overdue
   FROM public.device d;


CREATE OR REPLACE FUNCTION public.set_created_and_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_created_at_only()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.created_at := now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end;
$function$
;

grant delete on table "public"."department" to "anon";

grant insert on table "public"."department" to "anon";

grant references on table "public"."department" to "anon";

grant select on table "public"."department" to "anon";

grant trigger on table "public"."department" to "anon";

grant truncate on table "public"."department" to "anon";

grant update on table "public"."department" to "anon";

grant delete on table "public"."department" to "authenticated";

grant insert on table "public"."department" to "authenticated";

grant references on table "public"."department" to "authenticated";

grant select on table "public"."department" to "authenticated";

grant trigger on table "public"."department" to "authenticated";

grant truncate on table "public"."department" to "authenticated";

grant update on table "public"."department" to "authenticated";

grant delete on table "public"."department" to "service_role";

grant insert on table "public"."department" to "service_role";

grant references on table "public"."department" to "service_role";

grant select on table "public"."department" to "service_role";

grant trigger on table "public"."department" to "service_role";

grant truncate on table "public"."department" to "service_role";

grant update on table "public"."department" to "service_role";

grant delete on table "public"."device" to "anon";

grant insert on table "public"."device" to "anon";

grant references on table "public"."device" to "anon";

grant select on table "public"."device" to "anon";

grant trigger on table "public"."device" to "anon";

grant truncate on table "public"."device" to "anon";

grant update on table "public"."device" to "anon";

grant delete on table "public"."device" to "authenticated";

grant insert on table "public"."device" to "authenticated";

grant references on table "public"."device" to "authenticated";

grant select on table "public"."device" to "authenticated";

grant trigger on table "public"."device" to "authenticated";

grant truncate on table "public"."device" to "authenticated";

grant update on table "public"."device" to "authenticated";

grant delete on table "public"."device" to "service_role";

grant insert on table "public"."device" to "service_role";

grant references on table "public"."device" to "service_role";

grant select on table "public"."device" to "service_role";

grant trigger on table "public"."device" to "service_role";

grant truncate on table "public"."device" to "service_role";

grant update on table "public"."device" to "service_role";

grant delete on table "public"."device_document" to "anon";

grant insert on table "public"."device_document" to "anon";

grant references on table "public"."device_document" to "anon";

grant select on table "public"."device_document" to "anon";

grant trigger on table "public"."device_document" to "anon";

grant truncate on table "public"."device_document" to "anon";

grant update on table "public"."device_document" to "anon";

grant delete on table "public"."device_document" to "authenticated";

grant insert on table "public"."device_document" to "authenticated";

grant references on table "public"."device_document" to "authenticated";

grant select on table "public"."device_document" to "authenticated";

grant trigger on table "public"."device_document" to "authenticated";

grant truncate on table "public"."device_document" to "authenticated";

grant update on table "public"."device_document" to "authenticated";

grant delete on table "public"."device_document" to "service_role";

grant insert on table "public"."device_document" to "service_role";

grant references on table "public"."device_document" to "service_role";

grant select on table "public"."device_document" to "service_role";

grant trigger on table "public"."device_document" to "service_role";

grant truncate on table "public"."device_document" to "service_role";

grant update on table "public"."device_document" to "service_role";

grant delete on table "public"."device_group" to "anon";

grant insert on table "public"."device_group" to "anon";

grant references on table "public"."device_group" to "anon";

grant select on table "public"."device_group" to "anon";

grant trigger on table "public"."device_group" to "anon";

grant truncate on table "public"."device_group" to "anon";

grant update on table "public"."device_group" to "anon";

grant delete on table "public"."device_group" to "authenticated";

grant insert on table "public"."device_group" to "authenticated";

grant references on table "public"."device_group" to "authenticated";

grant select on table "public"."device_group" to "authenticated";

grant trigger on table "public"."device_group" to "authenticated";

grant truncate on table "public"."device_group" to "authenticated";

grant update on table "public"."device_group" to "authenticated";

grant delete on table "public"."device_group" to "service_role";

grant insert on table "public"."device_group" to "service_role";

grant references on table "public"."device_group" to "service_role";

grant select on table "public"."device_group" to "service_role";

grant trigger on table "public"."device_group" to "service_role";

grant truncate on table "public"."device_group" to "service_role";

grant update on table "public"."device_group" to "service_role";

grant delete on table "public"."device_photo" to "anon";

grant insert on table "public"."device_photo" to "anon";

grant references on table "public"."device_photo" to "anon";

grant select on table "public"."device_photo" to "anon";

grant trigger on table "public"."device_photo" to "anon";

grant truncate on table "public"."device_photo" to "anon";

grant update on table "public"."device_photo" to "anon";

grant delete on table "public"."device_photo" to "authenticated";

grant insert on table "public"."device_photo" to "authenticated";

grant references on table "public"."device_photo" to "authenticated";

grant select on table "public"."device_photo" to "authenticated";

grant trigger on table "public"."device_photo" to "authenticated";

grant truncate on table "public"."device_photo" to "authenticated";

grant update on table "public"."device_photo" to "authenticated";

grant delete on table "public"."device_photo" to "service_role";

grant insert on table "public"."device_photo" to "service_role";

grant references on table "public"."device_photo" to "service_role";

grant select on table "public"."device_photo" to "service_role";

grant trigger on table "public"."device_photo" to "service_role";

grant truncate on table "public"."device_photo" to "service_role";

grant update on table "public"."device_photo" to "service_role";

grant delete on table "public"."manufacturer" to "anon";

grant insert on table "public"."manufacturer" to "anon";

grant references on table "public"."manufacturer" to "anon";

grant select on table "public"."manufacturer" to "anon";

grant trigger on table "public"."manufacturer" to "anon";

grant truncate on table "public"."manufacturer" to "anon";

grant update on table "public"."manufacturer" to "anon";

grant delete on table "public"."manufacturer" to "authenticated";

grant insert on table "public"."manufacturer" to "authenticated";

grant references on table "public"."manufacturer" to "authenticated";

grant select on table "public"."manufacturer" to "authenticated";

grant trigger on table "public"."manufacturer" to "authenticated";

grant truncate on table "public"."manufacturer" to "authenticated";

grant update on table "public"."manufacturer" to "authenticated";

grant delete on table "public"."manufacturer" to "service_role";

grant insert on table "public"."manufacturer" to "service_role";

grant references on table "public"."manufacturer" to "service_role";

grant select on table "public"."manufacturer" to "service_role";

grant trigger on table "public"."manufacturer" to "service_role";

grant truncate on table "public"."manufacturer" to "service_role";

grant update on table "public"."manufacturer" to "service_role";


  create policy "authenticated_delete_department"
  on "public"."department"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_department"
  on "public"."department"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_department"
  on "public"."department"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_department"
  on "public"."department"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_device"
  on "public"."device"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_device"
  on "public"."device"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_device"
  on "public"."device"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_device"
  on "public"."device"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_device_document"
  on "public"."device_document"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_device_document"
  on "public"."device_document"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_device_document"
  on "public"."device_document"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_device_document"
  on "public"."device_document"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_device_group"
  on "public"."device_group"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_device_group"
  on "public"."device_group"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_device_group"
  on "public"."device_group"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_device_group"
  on "public"."device_group"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_device_photo"
  on "public"."device_photo"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_device_photo"
  on "public"."device_photo"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_device_photo"
  on "public"."device_photo"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_device_photo"
  on "public"."device_photo"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "authenticated_delete_manufacturer"
  on "public"."manufacturer"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "authenticated_insert_manufacturer"
  on "public"."manufacturer"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "authenticated_select_manufacturer"
  on "public"."manufacturer"
  as permissive
  for select
  to authenticated
using (true);



  create policy "authenticated_update_manufacturer"
  on "public"."manufacturer"
  as permissive
  for update
  to authenticated
using (true)
with check (true);


CREATE TRIGGER department_set_timestamps_insert BEFORE INSERT ON public.department FOR EACH ROW EXECUTE FUNCTION public.set_created_and_updated_at();

CREATE TRIGGER department_set_timestamps_update BEFORE UPDATE ON public.department FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER device_set_timestamps_insert BEFORE INSERT ON public.device FOR EACH ROW EXECUTE FUNCTION public.set_created_and_updated_at();

CREATE TRIGGER device_set_timestamps_update BEFORE UPDATE ON public.device FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER device_document_set_created_at BEFORE INSERT ON public.device_document FOR EACH ROW EXECUTE FUNCTION public.set_created_at_only();

CREATE TRIGGER device_group_set_timestamps_insert BEFORE INSERT ON public.device_group FOR EACH ROW EXECUTE FUNCTION public.set_created_and_updated_at();

CREATE TRIGGER device_group_set_timestamps_update BEFORE UPDATE ON public.device_group FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER device_photo_set_created_at BEFORE INSERT ON public.device_photo FOR EACH ROW EXECUTE FUNCTION public.set_created_at_only();

CREATE TRIGGER manufacturer_set_timestamps_insert BEFORE INSERT ON public.manufacturer FOR EACH ROW EXECUTE FUNCTION public.set_created_and_updated_at();

CREATE TRIGGER manufacturer_set_timestamps_update BEFORE UPDATE ON public.manufacturer FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


  create policy "authenticated_delete_device_documents"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'device-documents'::text));



  create policy "authenticated_delete_device_photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'device-photos'::text));



  create policy "authenticated_insert_device_documents"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'device-documents'::text));



  create policy "authenticated_insert_device_photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'device-photos'::text));



  create policy "authenticated_select_device_documents"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'device-documents'::text));



  create policy "authenticated_select_device_photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'device-photos'::text));



  create policy "authenticated_update_device_documents"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'device-documents'::text))
with check ((bucket_id = 'device-documents'::text));



  create policy "authenticated_update_device_photos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'device-photos'::text))
with check ((bucket_id = 'device-photos'::text));



