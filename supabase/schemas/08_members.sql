-- ============================================================
-- DeviceHub — members & access
-- member.id is the SAME uuid as auth.users.id (populated on first sign-in
-- by the auth callback). RLS uses auth.uid() directly.
-- ============================================================

create type member_role   as enum ('it_admin', 'manager', 'viewer');
create type member_status as enum ('active', 'invited', 'disabled');

create table member (
  id             uuid primary key,
  name           text not null,
  email          text not null unique,
  role           member_role   not null default 'viewer',
  status         member_status not null default 'invited',

  department_id  uuid references department(id) on delete set null,
  site           text,
  phone          text,
  reports_to     uuid references member(id) on delete set null,

  joined_at      date,
  last_active_at timestamptz,
  invited_by     uuid references member(id) on delete set null,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index member_department_idx on member(department_id);
create index member_role_idx       on member(role);

create function member_role_label(r member_role) returns text
language sql immutable as $$
  select case r
    when 'it_admin' then 'IT Admin'
    when 'manager'  then 'Manager'
    when 'viewer'   then 'Viewer'
  end;
$$;

-- ============================================================
-- Role-gating helpers used by RLS policies.
-- STABLE so they're cached within a statement; SECURITY DEFINER
-- so they see the member row even when RLS would otherwise hide it.
-- ============================================================

create function app_role() returns member_role
language sql stable security definer set search_path = public as $$
  select role from member where id = auth.uid();
$$;

create function app_dept() returns uuid
language sql stable security definer set search_path = public as $$
  select department_id from member where id = auth.uid();
$$;
