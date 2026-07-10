create type "public"."checkin_outcome" as enum ('normal', 'consumed', 'other');


  create table "public"."checkins" (
    "id" uuid not null default gen_random_uuid(),
    "checkout_id" uuid not null,
    "outcome" public.checkin_outcome not null,
    "quantity" integer not null,
    "condition" integer,
    "photos" jsonb not null default '[]'::jsonb,
    "notes" text,
    "split_to_device_id" uuid,
    "checked_in_by" uuid default public.app_user_id(),
    "checked_in_at" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."checkins" enable row level security;


  create table "public"."checkouts" (
    "id" uuid not null default gen_random_uuid(),
    "device_id" uuid not null,
    "borrower_name" text not null,
    "quantity" integer not null,
    "checked_out_by" uuid default public.app_user_id(),
    "checked_out_at" timestamp with time zone not null default now(),
    "expected_return_date" date,
    "photos" jsonb not null default '[]'::jsonb,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."checkouts" enable row level security;

alter table "public"."devices" add column "split_from_device_id" uuid;

CREATE INDEX checkins_checkout_idx ON public.checkins USING btree (checkout_id);

CREATE UNIQUE INDEX checkins_pkey ON public.checkins USING btree (id);

CREATE INDEX checkouts_active_idx ON public.checkouts USING btree (device_id, expected_return_date);

CREATE INDEX checkouts_device_idx ON public.checkouts USING btree (device_id);

CREATE UNIQUE INDEX checkouts_pkey ON public.checkouts USING btree (id);

CREATE INDEX devices_split_from_idx ON public.devices USING btree (split_from_device_id);

alter table "public"."checkins" add constraint "checkins_pkey" PRIMARY KEY using index "checkins_pkey";

alter table "public"."checkouts" add constraint "checkouts_pkey" PRIMARY KEY using index "checkouts_pkey";

alter table "public"."checkins" add constraint "checkins_check" CHECK (((outcome = 'normal'::public.checkin_outcome) OR ((condition IS NULL) AND (split_to_device_id IS NULL)))) not valid;

alter table "public"."checkins" validate constraint "checkins_check";

alter table "public"."checkins" add constraint "checkins_checked_in_by_fkey" FOREIGN KEY (checked_in_by) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."checkins" validate constraint "checkins_checked_in_by_fkey";

alter table "public"."checkins" add constraint "checkins_checkout_id_fkey" FOREIGN KEY (checkout_id) REFERENCES public.checkouts(id) ON DELETE RESTRICT not valid;

alter table "public"."checkins" validate constraint "checkins_checkout_id_fkey";

alter table "public"."checkins" add constraint "checkins_condition_check" CHECK (((condition >= 0) AND (condition <= 100))) not valid;

alter table "public"."checkins" validate constraint "checkins_condition_check";

alter table "public"."checkins" add constraint "checkins_photos_check" CHECK ((jsonb_typeof(photos) = 'array'::text)) not valid;

alter table "public"."checkins" validate constraint "checkins_photos_check";

alter table "public"."checkins" add constraint "checkins_quantity_check" CHECK ((quantity >= 1)) not valid;

alter table "public"."checkins" validate constraint "checkins_quantity_check";

alter table "public"."checkins" add constraint "checkins_split_to_device_id_fkey" FOREIGN KEY (split_to_device_id) REFERENCES public.devices(id) ON DELETE SET NULL not valid;

alter table "public"."checkins" validate constraint "checkins_split_to_device_id_fkey";

alter table "public"."checkouts" add constraint "checkouts_checked_out_by_fkey" FOREIGN KEY (checked_out_by) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."checkouts" validate constraint "checkouts_checked_out_by_fkey";

alter table "public"."checkouts" add constraint "checkouts_device_id_fkey" FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE RESTRICT not valid;

alter table "public"."checkouts" validate constraint "checkouts_device_id_fkey";

alter table "public"."checkouts" add constraint "checkouts_photos_check" CHECK ((jsonb_typeof(photos) = 'array'::text)) not valid;

alter table "public"."checkouts" validate constraint "checkouts_photos_check";

alter table "public"."checkouts" add constraint "checkouts_quantity_check" CHECK ((quantity >= 1)) not valid;

alter table "public"."checkouts" validate constraint "checkouts_quantity_check";

alter table "public"."devices" add constraint "devices_split_from_device_id_fkey" FOREIGN KEY (split_from_device_id) REFERENCES public.devices(id) ON DELETE SET NULL not valid;

alter table "public"."devices" validate constraint "devices_split_from_device_id_fkey";

grant delete on table "public"."checkins" to "authenticated";

grant insert on table "public"."checkins" to "authenticated";

grant references on table "public"."checkins" to "authenticated";

grant select on table "public"."checkins" to "authenticated";

grant trigger on table "public"."checkins" to "authenticated";

grant truncate on table "public"."checkins" to "authenticated";

grant update on table "public"."checkins" to "authenticated";

grant delete on table "public"."checkins" to "service_role";

grant insert on table "public"."checkins" to "service_role";

grant references on table "public"."checkins" to "service_role";

grant select on table "public"."checkins" to "service_role";

grant trigger on table "public"."checkins" to "service_role";

grant truncate on table "public"."checkins" to "service_role";

grant update on table "public"."checkins" to "service_role";

grant delete on table "public"."checkouts" to "authenticated";

grant insert on table "public"."checkouts" to "authenticated";

grant references on table "public"."checkouts" to "authenticated";

grant select on table "public"."checkouts" to "authenticated";

grant trigger on table "public"."checkouts" to "authenticated";

grant truncate on table "public"."checkouts" to "authenticated";

grant update on table "public"."checkouts" to "authenticated";

grant delete on table "public"."checkouts" to "service_role";

grant insert on table "public"."checkouts" to "service_role";

grant references on table "public"."checkouts" to "service_role";

grant select on table "public"."checkouts" to "service_role";

grant trigger on table "public"."checkouts" to "service_role";

grant truncate on table "public"."checkouts" to "service_role";

grant update on table "public"."checkouts" to "service_role";


  create policy "checkins_delete"
  on "public"."checkins"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "checkins_insert"
  on "public"."checkins"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "checkins_read"
  on "public"."checkins"
  as permissive
  for select
  to authenticated
using (true);



  create policy "checkins_update"
  on "public"."checkins"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "checkouts_delete"
  on "public"."checkouts"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "checkouts_insert"
  on "public"."checkouts"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "checkouts_read"
  on "public"."checkouts"
  as permissive
  for select
  to authenticated
using (true);



  create policy "checkouts_update"
  on "public"."checkouts"
  as permissive
  for update
  to authenticated
using (true)
with check (true);


CREATE TRIGGER checkins_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.checkins FOR EACH ROW EXECUTE FUNCTION private.log_activity('id');

CREATE TRIGGER checkouts_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION private.log_activity('borrower_name');

CREATE TRIGGER checkouts_set_updated_at BEFORE UPDATE ON public.checkouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

revoke delete on table "public"."checkins" from "anon";

revoke insert on table "public"."checkins" from "anon";

revoke references on table "public"."checkins" from "anon";

revoke select on table "public"."checkins" from "anon";

revoke trigger on table "public"."checkins" from "anon";

revoke truncate on table "public"."checkins" from "anon";

revoke update on table "public"."checkins" from "anon";

revoke delete on table "public"."checkouts" from "anon";

revoke insert on table "public"."checkouts" from "anon";

revoke references on table "public"."checkouts" from "anon";

revoke select on table "public"."checkouts" from "anon";

revoke trigger on table "public"."checkouts" from "anon";

revoke truncate on table "public"."checkouts" from "anon";

revoke update on table "public"."checkouts" from "anon";


