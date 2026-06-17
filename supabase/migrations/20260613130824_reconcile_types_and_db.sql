alter table "public"."devices" drop constraint "devices_manufacturer_id_fkey";

alter table "public"."devices" alter column "status" drop default;

alter table "public"."users" alter column "status" drop default;

-- users_update RLS policy references the `status` column, blocking the
-- ALTER COLUMN TYPE below. Drop it here and recreate at the end (verbatim
-- copy of the definition in supabase/schemas/users.sql).
drop policy "users_update" on "public"."users";

alter type "public"."device_status" rename to "device_status__old_version_to_be_dropped";

create type "public"."device_status" as enum ('in-use', 'storage', 'repair', 'retired');

alter type "public"."user_status" rename to "user_status__old_version_to_be_dropped";

create type "public"."user_status" as enum ('active', 'invited', 'deactivated');

alter table "public"."devices" alter column status type "public"."device_status" using (
  case status::text
    when 'in-storage' then 'storage'
    when 'in-repair'  then 'repair'
    else status::text
  end
)::"public"."device_status";

alter table "public"."users" alter column status type "public"."user_status" using (
  case status::text
    when 'disabled' then 'deactivated'
    else status::text
  end
)::"public"."user_status";

alter table "public"."users" alter column "status" set default 'invited'::public.user_status;

drop type "public"."device_status__old_version_to_be_dropped";

drop type "public"."user_status__old_version_to_be_dropped";

alter table "public"."devices" alter column "manufacturer_id" set not null;

alter table "public"."devices" alter column "status" set default 'storage'::public.device_status;

alter table "public"."units" add column "description" text;

alter table "public"."devices" add constraint "devices_manufacturer_id_fkey" FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE RESTRICT not valid;

alter table "public"."devices" validate constraint "devices_manufacturer_id_fkey";

-- Recreate users_update policy (dropped above so the status enum could be
-- re-typed). Definition mirrors supabase/schemas/users.sql.
create policy users_update on public.users
  for update to authenticated
  using (
    public.is_admin()
    or auth_user_id = (select auth.uid())
  )
  with check (
    public.is_admin()
    or (
      auth_user_id = (select auth.uid())
      and role         = (select u.role         from public.users u where u.auth_user_id = (select auth.uid()))
      and status       = (select u.status       from public.users u where u.auth_user_id = (select auth.uid()))
      and auth_user_id is not distinct from (select u.auth_user_id from public.users u where u.auth_user_id = (select auth.uid()))
      and invited_by   is not distinct from (select u.invited_by   from public.users u where u.auth_user_id = (select auth.uid()))
      and deleted_at   is not distinct from (select u.deleted_at   from public.users u where u.auth_user_id = (select auth.uid()))
    )
  );


