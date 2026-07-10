-- First admin bootstrap. Google sign-in with this email is allowed by the
-- before_user_created hook; the link trigger then activates this row.
insert into public.users (name, email, role, status)
values ('Vinh Huynh', 'vinh.huynh@sioux.asia', 'admin', 'invited')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- Loginable dev users (local only). For each: insert the allowlist row, then a
-- confirmed email/password auth user + identity. The link_auth_user trigger
-- (AFTER INSERT on auth.users) matches by email and flips status -> 'active'.
--
--   admin  — dev-admin@devicehub.test  / DevAdminP@ss1!
--   member — dev-member@devicehub.test / DevMemberP@ss1!
--
-- Idempotent: the auth user is only created when absent, so re-running (or
-- `supabase db reset`) is safe.
-- ---------------------------------------------------------------------------
do $$
declare
  u   record;
  uid uuid;
begin
  for u in
    select *
    from (values
      ('Dev Admin',  'dev-admin@devicehub.test',  'admin',  'DevAdminP@ss1!'),
      ('Dev Member', 'dev-member@devicehub.test', 'member', 'DevMemberP@ss1!')
    ) as t(name, email, role, password)
  loop
    -- Allowlist row first, so the link trigger has a row to match.
    insert into public.users (name, email, role, status)
    values (u.name, u.email, u.role::public.user_role, 'invited')
    on conflict (email) do nothing;

    if not exists (select 1 from auth.users where email = u.email) then
      uid := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
        -- GoTrue scans these token columns as non-nullable strings; NULL causes
        -- a 500 on login, so seed them as empty strings.
        confirmation_token, recovery_token, email_change,
        email_change_token_new, email_change_token_current,
        phone_change, phone_change_token, reauthentication_token
      ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        u.email, crypt(u.password, gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        '{}'::jsonb, false, false,
        '', '', '', '', '', '', '', ''
      );

      -- Email identity (provider_id = the auth user's id, per GoTrue convention).
      insert into auth.identities (
        provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) values (
        uid::text, uid,
        jsonb_build_object(
          'sub', uid::text, 'email', u.email,
          'email_verified', true, 'phone_verified', false
        ),
        'email', now(), now(), now()
      );
    end if;
  end loop;
end $$;
