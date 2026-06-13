-- Set org_settings.updated_by / updated_at server-side so the client
-- cannot spoof these audit-trail fields. RLS already restricts writes
-- to it_admin (org_settings_write policy); this hardens the audit trail.

create or replace function set_org_settings_updated_meta()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists org_settings_set_updated_meta on org_settings;
create trigger org_settings_set_updated_meta
  before update on org_settings
  for each row execute function set_org_settings_updated_meta();
