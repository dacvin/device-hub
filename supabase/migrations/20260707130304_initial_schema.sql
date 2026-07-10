create schema if not exists "private";

create type "public"."activity_action" as enum ('insert', 'update', 'delete', 'restore');

create type "public"."user_role" as enum ('admin', 'member');

create type "public"."user_status" as enum ('active', 'invited', 'deactivated');


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

CREATE INDEX users_active_idx ON public.users USING btree (deleted_at) WHERE (deleted_at IS NULL);

CREATE INDEX users_auth_user_id_idx ON public.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_auth_user_id_key ON public.users USING btree (auth_user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE INDEX users_role_idx ON public.users USING btree (role);

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."activities" add constraint "activities_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."activities" validate constraint "activities_actor_id_fkey";

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

grant references on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant references on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant references on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant references on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant references on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";


  create policy "activities_read"
  on "public"."activities"
  as permissive
  for select
  to authenticated
using (true);



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


CREATE TRIGGER users_log_activity AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION private.log_activity('email');

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


