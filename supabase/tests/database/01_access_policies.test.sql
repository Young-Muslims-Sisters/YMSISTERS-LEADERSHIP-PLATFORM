-- Allow/deny tests for grants + RLS. Run with: supabase test db
-- Relies on supabase/seed.sql (fictional data).
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- Fixtures: sign-ins that must be refused, and one YM member.
create function pg_temp.sign_in(n int, age interval default '0') returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', format('91000000-0000-0000-0000-%s', lpad(n::text, 12, '0')), 'role', 'authenticated',
    'amr', jsonb_build_array(jsonb_build_object('method', 'oauth', 'timestamp', extract(epoch from now() - age)::bigint))
  )::text, true);
$$;
insert into private.allowed_domains values ('ym.test');
insert into auth.users (id, aud, role, email)
select format('91000000-0000-0000-0000-%s', lpad(v.n::text, 12, '0'))::uuid, 'authenticated', 'authenticated', v.email
from (values (1, 'a@gmail.test'), (2, 'member@ym.test'), (3, 'password@ym.test'), (4, 'personal@ym.test'),
             (5, 'x@ym.test.evil.test'), (6, 'unverified@ym.test')) as v (n, email);
insert into auth.identities (id, user_id, provider_id, identity_data, provider)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('email', u.email, 'email_verified', u.email not like 'unverified%')
    || case when u.email like 'personal%' then '{}'::jsonb
            else jsonb_build_object('custom_claims', jsonb_build_object('hd', split_part(u.email, '@', 2))) end,
  case when u.email like 'password%' then 'email' else 'google' end
from auth.users u where u.id::text like '91000000-%';

-- ---------------------------------------------------------------- anon
set local role anon;

select isnt_empty('select 1 from public.regions', 'anon can read regions (form lists)');
select isnt_empty('select 1 from public.role_types', 'anon can read role types (form lists)');
select throws_ok('select * from public.users', '42501', null, 'anon cannot read users');
select throws_ok('select public.my_access()', '42501', null, 'anon cannot call my_access');
select throws_ok('select * from public.annual_submissions', '42501', null, 'anon cannot read submissions');
select throws_ok('select * from public.notification_deliveries', '42501', null, 'anon cannot read deliveries');
select throws_ok('select * from public.src_email_routes', '42501', null, 'anon cannot read SRC routes');
select throws_ok($$select public.submit_annual_form('{}'::jsonb)$$, '42501', null, 'anon cannot call intake directly');
select throws_ok('select * from public.identity_mismatches', '42501', null, 'anon cannot read identity mismatches');
select isnt_empty($$select 1 from public.profile_tags where label = 'Graphic Design'$$, 'anon sees approved skill suggestions');
select is_empty($$select 1 from public.profile_tags where label = 'Calligraphy'$$, 'anon cannot see other people''s typed-in skills');

reset role;

-- ------------------------------------------------- signed in, no access
set local role authenticated;
select pg_temp.sign_in(1);

select is(public.my_access(), 'none', 'Google account outside the YM domain has no access');
select pg_temp.sign_in(3);
select is(public.my_access(), 'none', 'password account claiming a YM email has no access');
select pg_temp.sign_in(4);
select is(public.my_access(), 'none', 'personal Google account using a YM email has no access');
select pg_temp.sign_in(5);
select is(public.my_access(), 'none', 'look-alike domain has no access');
select pg_temp.sign_in(6);
select is(public.my_access(), 'none', 'unverified Google email has no access');
select pg_temp.sign_in(2, '8 days');
select is(public.my_access(), 'none', 'sign-in older than 7 days has no access');
select is_empty('select 1 from public.users', 'expired sign-in sees no directory rows');
select throws_ok('select * from private.it_admins', '42501', null, 'IT list is not readable');
select throws_ok($$insert into private.allowed_domains values ('evil.test')$$, '42501', null, 'domain list is not writable');
select pg_temp.sign_in(1);

select is_empty('select 1 from public.users', 'no-access user sees no directory rows');
select is_empty('select 1 from public.annual_submissions', 'no-access user sees no submissions');
select throws_ok($$select public.submit_annual_form('{}'::jsonb)$$, '42501', null, 'authenticated cannot call intake directly');
select throws_ok('select * from public.identity_mismatches', '42501', null, 'authenticated cannot read identity mismatches');
select throws_ok($$update public.users set phone = 'x'$$, '42501', null, 'authenticated cannot write users');

reset role;

-- ------------------------------------------------------ YM member
set local role authenticated;
select pg_temp.sign_in(2);

select is(public.my_access(), 'member', 'YM Workspace account is a member');

select isnt_empty('select 1 from public.users', 'member can read the whole directory');
select isnt_empty('select 1 from public.role_assignments', 'member can read roles');
select isnt_empty($$select 1 from public.profile_tags where label = 'Calligraphy'$$, 'member sees typed-in skills on profiles');
select is_empty('select 1 from public.annual_submissions', 'member cannot read submissions (sensitive answers)');
select is_empty('select 1 from public.notification_deliveries', 'member cannot read deliveries');
select is_empty('select 1 from public.src_email_routes', 'member cannot read SRC routes');
select throws_ok(
  $$insert into public.src_email_routes (subregion_id, recipient_email)
    select id, 'x@example.test' from public.subregions where code = 'GEORGIA'$$,
  '42501', null, 'member cannot add SRC routes');

reset role;

-- ------------------------------------------------------------ IT admin
set local role authenticated;
reset role;
insert into private.it_admins values ('member@ym.test');
set local role authenticated;
select pg_temp.sign_in(2);

select is(public.my_access(), 'it_admin', 'listed YM account is an IT admin');

select isnt_empty('select 1 from public.annual_submissions', 'IT admin reads submissions');
select isnt_empty('select 1 from public.notification_deliveries', 'IT admin reads delivery status');
select is((select count(*) from public.src_email_routes)::int, 2, 'IT admin reads SRC routes');
select lives_ok(
  $$insert into public.src_email_routes (subregion_id, recipient_email)
    select id, 'src-georgia@example.test' from public.subregions where code = 'GEORGIA'$$,
  'IT admin can add an SRC route');

reset role;

-- Schema guard: sensitive fields never become directory columns.
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name in ('birthday', 'ethnicity', 'answers')),
  'users table holds no sensitive columns');

select * from finish();
rollback;
