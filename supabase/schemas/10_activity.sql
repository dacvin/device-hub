-- ============================================================
-- DeviceHub — activity log
-- One row per mutation, written by the app-layer logActivity() helper.
-- ============================================================

create type activity_action as enum (
  'device.created', 'device.updated', 'device.status_changed',
  'device.deleted', 'device.restored',
  'device.inventory_checked', 'device.allocated',
  'member.invited', 'member.role_changed', 'member.removed',
  'catalog.created', 'catalog.updated', 'catalog.deleted',
  'settings.updated'
);

create table activity (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references member(id) on delete set null,
  action       activity_action not null,
  entity_type  text not null,
  entity_id    uuid,
  entity_label text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index activity_created_idx ON activity(created_at desc);
create index activity_entity_idx  ON activity(entity_type, entity_id, created_at desc);
create index activity_actor_idx   ON activity(actor_id, created_at desc);
