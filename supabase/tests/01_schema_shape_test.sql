-- ============================================================
-- 01_schema_shape_test.sql
-- Verifies: tables exist, columns/types correct, enums exist with
-- correct labels, and the device/group/unit/manufacturer tables exist.
-- ============================================================
BEGIN;
SELECT plan(48);

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- ============================================================
-- Tables exist
-- ============================================================
SELECT extensions.has_table('public', 'users',      'table public.users exists');
SELECT extensions.has_table('public', 'activities', 'table public.activities exists');

-- ============================================================
-- Device-domain tables exist
-- ============================================================
SELECT extensions.has_table('public', 'devices',       'table public.devices exists');
SELECT extensions.has_table('public', 'groups',        'table public.groups exists');
SELECT extensions.has_table('public', 'manufacturers', 'table public.manufacturers exists');
SELECT extensions.hasnt_table('public', 'units',       'table public.units was dropped (unit is now an enum)');
SELECT extensions.has_column('public', 'devices', 'unit', 'devices.unit column exists');

-- ============================================================
-- public.users columns
-- ============================================================
SELECT extensions.has_column('public', 'users', 'id',             'users.id exists');
SELECT extensions.has_column('public', 'users', 'auth_user_id',   'users.auth_user_id exists');
SELECT extensions.has_column('public', 'users', 'name',           'users.name exists');
SELECT extensions.has_column('public', 'users', 'email',          'users.email exists');
SELECT extensions.has_column('public', 'users', 'phone',          'users.phone exists');
SELECT extensions.has_column('public', 'users', 'role',           'users.role exists');
SELECT extensions.has_column('public', 'users', 'status',         'users.status exists');
SELECT extensions.has_column('public', 'users', 'joined_at',      'users.joined_at exists');
SELECT extensions.has_column('public', 'users', 'last_active_at', 'users.last_active_at exists');
SELECT extensions.has_column('public', 'users', 'invited_by',     'users.invited_by exists');
SELECT extensions.has_column('public', 'users', 'created_at',     'users.created_at exists');
SELECT extensions.has_column('public', 'users', 'updated_at',     'users.updated_at exists');
SELECT extensions.has_column('public', 'users', 'deleted_at',     'users.deleted_at exists');

-- Key column types
SELECT extensions.col_type_is('public', 'users', 'id',           'uuid',                      'users.id is uuid');
SELECT extensions.col_type_is('public', 'users', 'auth_user_id', 'uuid',                      'users.auth_user_id is uuid');
SELECT extensions.col_type_is('public', 'users', 'name',         'text',                      'users.name is text');
SELECT extensions.col_type_is('public', 'users', 'email',        'text',                      'users.email is text');
SELECT extensions.col_type_is('public', 'users', 'role',         'user_role',                 'users.role is user_role enum');
SELECT extensions.col_type_is('public', 'users', 'status',       'user_status',               'users.status is user_status enum');
SELECT extensions.col_type_is('public', 'users', 'joined_at',    'date',                      'users.joined_at is date');
SELECT extensions.col_type_is('public', 'users', 'created_at',   'timestamp with time zone',  'users.created_at is timestamptz');
SELECT extensions.col_type_is('public', 'users', 'updated_at',   'timestamp with time zone',  'users.updated_at is timestamptz');
SELECT extensions.col_type_is('public', 'users', 'deleted_at',   'timestamp with time zone',  'users.deleted_at is timestamptz');

-- ============================================================
-- public.activities columns
-- ============================================================
SELECT extensions.has_column('public', 'activities', 'id',           'activities.id exists');
SELECT extensions.has_column('public', 'activities', 'actor_id',     'activities.actor_id exists');
SELECT extensions.has_column('public', 'activities', 'action',       'activities.action exists');
SELECT extensions.has_column('public', 'activities', 'entity_type',  'activities.entity_type exists');
SELECT extensions.has_column('public', 'activities', 'entity_id',    'activities.entity_id exists');
SELECT extensions.has_column('public', 'activities', 'entity_label', 'activities.entity_label exists');
SELECT extensions.has_column('public', 'activities', 'before',       'activities.before exists');
SELECT extensions.has_column('public', 'activities', 'after',        'activities.after exists');
SELECT extensions.has_column('public', 'activities', 'created_at',   'activities.created_at exists');

SELECT extensions.col_type_is('public', 'activities', 'action', 'activity_action', 'activities.action is activity_action enum');

-- ============================================================
-- Enums exist
-- ============================================================
SELECT extensions.has_enum('public', 'user_role',       'enum user_role exists');
SELECT extensions.has_enum('public', 'user_status',     'enum user_status exists');
SELECT extensions.has_enum('public', 'activity_action', 'enum activity_action exists');

-- Enum labels (exact set)
SELECT extensions.enum_has_labels('public', 'user_role',       ARRAY['admin','member'],                    'user_role labels');
SELECT extensions.enum_has_labels('public', 'user_status',     ARRAY['active','invited','deactivated'],     'user_status labels');
SELECT extensions.enum_has_labels('public', 'activity_action', ARRAY['insert','update','delete','restore'], 'activity_action labels');
SELECT extensions.has_enum('public', 'device_unit', 'enum device_unit exists');
SELECT extensions.enum_has_labels('public', 'device_unit', ARRAY['piece','set','unit','box','item'], 'device_unit labels');

SELECT * FROM finish();
ROLLBACK;
