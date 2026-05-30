-- ============================================================
-- DeviceHub — timestamp trigger functions
-- created_at and updated_at are DB-managed only. Clients cannot set them.
-- ============================================================

-- BEFORE INSERT (tables with both columns): force both timestamps.
create or replace function set_created_and_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

-- BEFORE UPDATE (tables with both columns): refresh updated_at, preserve created_at.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end;
$$;

-- BEFORE INSERT only (tables without updated_at: photos, documents).
create or replace function set_created_at_only()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  return new;
end;
$$;
