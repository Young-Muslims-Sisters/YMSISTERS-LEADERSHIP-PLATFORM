-- LOCAL DEVELOPMENT ONLY. Two fictional accounts for the local login buttons,
-- password "local-dev-only". Never run this on the hosted project.
insert into private.allowed_domains values ('example.test') on conflict do nothing;
insert into private.it_admins values ('it-admin@example.test') on conflict do nothing;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.email,
  extensions.crypt('local-dev-only', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email","google"]}', '{}', now(), now(), '', '', '', ''
from (values
  ('90000000-0000-0000-0000-000000000001', 'it-admin@example.test'),
  ('90000000-0000-0000-0000-000000000002', 'member@example.test')
) as v (id, email)
on conflict (id) do nothing;

-- Stand-ins for the identities Google sign-in creates.
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id, p.provider || '-' || u.id,
  jsonb_build_object('sub', u.id, 'email', u.email, 'email_verified', true,
                     'custom_claims', jsonb_build_object('hd', 'example.test')),
  p.provider, now(), now(), now()
from auth.users u
cross join (values ('email'), ('google')) as p (provider)
where u.id in ('90000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000002')
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = p.provider);
