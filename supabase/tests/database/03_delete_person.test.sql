-- IT delete tests. Run with: supabase test db
-- Relies on supabase/seed.sql (fictional data).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.sign_in(n int) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', format('92000000-0000-0000-0000-%s', lpad(n::text, 12, '0')), 'role', 'authenticated',
    'amr', jsonb_build_array(jsonb_build_object('method', 'oauth', 'timestamp', extract(epoch from now())::bigint))
  )::text, true);
$$;
insert into private.allowed_domains values ('ym.test');
insert into private.it_admins values ('it@ym.test');
insert into auth.users (id, aud, role, email) values
  ('92000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'member@ym.test'),
  ('92000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'it@ym.test');
insert into auth.identities (id, user_id, provider_id, identity_data, provider)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object(
  'email', u.email, 'email_verified', true, 'custom_claims', jsonb_build_object('hd', 'ym.test')), 'google'
from auth.users u where u.id::text like '92000000-%';

create temporary table target as
  select s.user_id as id, u.email, count(*)::int as submissions
  from public.annual_submissions s join public.users u on u.id = s.user_id
  where exists (select 1 from public.role_assignments r where r.user_id = u.id)
  group by s.user_id, u.email order by u.email limit 1;
grant select on target to authenticated, anon;
create temporary table before as select (select count(*)::int from public.users) as people;
insert into public.identity_mismatches (email) select lower(email) from target;
-- Someone else's submission that was flagged as a possible duplicate of the target.
update public.annual_submissions set possible_duplicate_user_id = (select id from target)
  where id = (select id from public.annual_submissions where user_id <> (select id from target) limit 1);

select is((select count(*)::int from target), 1, 'seed has a person to delete');

set local role anon;
select throws_ok('select public.delete_person((select id from target))', '42501', null, 'anon cannot delete');
reset role;

set local role authenticated;
select pg_temp.sign_in(1);
select is(public.my_access(), 'member', 'first account is a member');
select throws_ok('select public.delete_person((select id from target))', '42501', 'IT access required', 'a member cannot delete');
select pg_temp.sign_in(2);
select is(public.my_access(), 'it_admin', 'second account is IT');
select throws_ok('select public.delete_person(gen_random_uuid())', 'P0002', null, 'unknown person is refused');
select lives_ok('select public.delete_person((select id from target))', 'IT can delete');
select throws_ok('delete from public.users', '42501', null, 'IT still cannot delete rows directly');
reset role;

select is_empty('select 1 from public.users where id = (select id from target)', 'profile is gone');
select is_empty('select 1 from public.annual_submissions where user_id = (select id from target)', 'submissions are gone');
select is((select count(*)::int from public.users), (select people - 1 from before), 'nobody else was deleted');
select is_empty('select 1 from public.identity_mismatches where email = (select lower(email) from target)', 'failed matches are gone');
select is(
  (select details from public.audit_log where action = 'delete_person' and entity_id = (select id from target)),
  (select jsonb_build_object('actor_auth_id', '92000000-0000-0000-0000-000000000002', 'submissions_deleted', submissions) from target),
  'audit log keeps who and how many, without personal details');

select * from finish();
rollback;
