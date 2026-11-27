-- Position details, organization details, private details and locations. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

create function pg_temp.sign_in(n int) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', format('93000000-0000-0000-0000-%s', lpad(n::text, 12, '0')), 'role', 'authenticated',
    'amr', jsonb_build_array(jsonb_build_object('method', 'oauth', 'timestamp', extract(epoch from now())::bigint))
  )::text, true);
$$;
insert into private.allowed_domains values ('ym.test');
insert into private.national_shura values ('shura@ym.test');
insert into private.it_admins values ('it@ym.test');
insert into auth.users (id, aud, role, email) values
  ('93000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'member@ym.test'),
  ('93000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'shura@ym.test'),
  ('93000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'it@ym.test');
insert into auth.identities (id, user_id, provider_id, identity_data, provider)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object(
  'email', u.email, 'email_verified', true, 'custom_claims', jsonb_build_object('hd', 'ym.test')), 'google'
from auth.users u where u.id::text like '93000000-%';

create function pg_temp.payload(email text, private jsonb) returns jsonb language sql as $$
  select jsonb_build_object(
    'cycle_year', 2027, 'first_name', 'Feedback', 'last_name', 'Test', 'email', email, 'phone', '(555) 555-0199',
    'subregion_id', (select id from public.subregions where code = 'NJC'), 'involvement', 'active_leadership',
    'current_positions', jsonb_build_array(
      jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000003',
        'subregion_id', (select id from public.subregions where code = 'NJC'),
        'portfolio_team_id', (select id from public.teams where code = 'TARBIYYA')),
      jsonb_build_object('team_id', '50000000-0000-0000-0000-000000000001', 'team_title', 'lead', 'title_detail', 'Logistics')),
    'tags', jsonb_build_array(jsonb_build_object('kind', 'organization', 'label', 'Feedback MSA', 'role', 'President', 'details', 'Ran iftars')),
    'private', private,
    'answers', jsonb_build_object('birthday', '2003-01-01'));
$$;

create temporary table r as select public.submit_annual_form(pg_temp.payload('feedback@example.test', jsonb_build_object(
  'ym_email_status', 'has', 'ym_email', 'Feedback@YMSisters.com', 'address_line1', '1 Main St', 'city', 'Edison',
  'state', 'New Jersey', 'postal_code', '08817'))) as result;
create temporary table u as select (result ->> 'user_id')::uuid as id from r;
grant select on r, u to authenticated, anon;

select is(
  (select t.code from public.role_assignments a join public.teams t on t.id = a.portfolio_team_id
   where a.user_id = (select id from u) and a.superseded_at is null),
  'TARBIYYA', 'shura position keeps its portfolio');
select is(
  (select array[team_title, title_detail] from public.role_assignments
   where user_id = (select id from u) and team_id is not null and superseded_at is null),
  array['lead', 'Logistics'], 'team position keeps its title and what they lead');
select is(
  (select array[role, details] from public.user_profile_tags where user_id = (select id from u)),
  array['President', 'Ran iftars'], 'organization keeps role and details');
select is(
  (select array[ym_email, postal_code] from public.user_private_details where user_id = (select id from u)),
  array['feedback@ymsisters.com', '08817'], 'YM email and address are stored');

select throws_ok(
  $$select public.submit_annual_form(jsonb_set(pg_temp.payload('bad1@example.test', null),
    '{current_positions,1,team_title}', '"boss"'))$$,
  '23514', null, 'unknown team position is refused');
select throws_ok(
  $$select public.submit_annual_form(pg_temp.payload('bad2@example.test', '{"ym_email_status": "has", "ym_email": "me@gmail.com"}'))$$,
  '23514', null, 'a non-YM address is refused as the YM email');
select throws_ok(
  $$select public.submit_annual_form(pg_temp.payload('bad3@example.test', '{"postal_code": "ABCDE"}'))$$,
  '23514', null, 'a malformed ZIP code is refused');

-- A later submission without an address clears it.
select lives_ok(
  $$select public.submit_annual_form(pg_temp.payload('feedback@example.test', '{"ym_email_status": "needs"}'))$$,
  'resubmitting works');
select is(
  (select array[ym_email_status, coalesce(address_line1, 'none')] from public.user_private_details where user_id = (select id from u)),
  array['needs', 'none'], 'resubmitting replaces the private details');

-- Who can read private details -------------------------------------------
set local role anon;
select throws_ok('select * from public.user_private_details', '42501', null, 'anon cannot read private details');
reset role;
set local role authenticated;
select pg_temp.sign_in(1);
select is(public.my_access(), 'member', 'member signs in');
select is_empty('select 1 from public.user_private_details', 'a member sees no private details');
select isnt_empty('select 1 from public.users', 'the member still sees the directory');
select pg_temp.sign_in(2);
select is(public.my_access(), 'member', 'National Shura has member access, not IT');
select isnt_empty('select 1 from public.user_private_details', 'National Shura sees private details');
select is_empty('select 1 from public.annual_submissions', 'National Shura still cannot read raw submissions');
select pg_temp.sign_in(3);
select isnt_empty('select 1 from public.user_private_details', 'IT sees private details');
reset role;

select is((select name from public.teams where code = 'TARBIYYA'), 'Tarbiyyah', 'Tarbiyyah is spelled with an h');
select lives_ok($$select public.submit_annual_form(jsonb_set(pg_temp.payload('desc@example.test', null),
  '{previous_positions}', '[{"role_type_id": "40000000-0000-0000-0000-000000000001", "description": "Ran halaqas"}]'))$$,
  'a previous position can say what the person did');

-- Locations ------------------------------------------------------------------
select is(
  (select array_agg(n.name order by n.name) from public.neighbor_nets n join public.subregions s on s.id = n.subregion_id where s.code = 'NY-WEST'),
  array['Flushing', 'Jamaica', 'Kensington', 'Westchester'], 'New York West has its NeighborNets');
select is(
  (select array_agg(name order by name) from public.subregions where code in ('NJN', 'NJC', 'NJS')),
  array['New Jersey Central', 'New Jersey North', 'New Jersey South'], 'New Jersey subregions are written out');

select * from finish();
rollback;
