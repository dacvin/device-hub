alter table "public"."devices" drop constraint "devices_quantity_check";

alter table "public"."devices" add constraint "devices_quantity_check" CHECK ((quantity >= 0)) not valid;

alter table "public"."devices" validate constraint "devices_quantity_check";

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
    -- Read deleted_at from the snapshot so tables without the column (e.g.
    -- checkouts/checkins) don't error; missing key -> NULL -> not a restore.
    if (v_before ->> 'deleted_at') is not null and (v_after ->> 'deleted_at') is null then
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


