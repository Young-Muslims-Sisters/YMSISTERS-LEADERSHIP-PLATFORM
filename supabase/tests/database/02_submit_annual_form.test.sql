-- Intake pipeline tests. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

-- Fixture locations, so these tests do not depend on the real lists.
insert into public.regions (id, code, name) values
  ('10000000-0000-0000-0000-000000000001', 'TEST-R1', 'Test Region 1'),
  ('10000000-0000-0000-0000-000000000002', 'TEST-R2', 'Test Region 2');
insert into public.subregions (id, region_id, code, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'TEST-SR1', 'Test Subregion 1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'TEST-SR2', 'Test Subregion 2'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'TEST-SR3', 'Test Subregion 3 (no route)');
insert into public.neighbor_nets (id, subregion_id, code, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'TEST-NN1', 'Test NN 1'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'TEST-NN2', 'Test NN 2');
insert into public.subregions (id, code, name) values
  ('20000000-0000-0000-0000-000000000004', 'TEST-SR4', 'Test Subregion 4 (no region)');
insert into public.neighbor_nets (id, region_id, code, name, state) values
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'TEST-NN5', 'Test Region NN', 'Ohio');
insert into public.src_email_routes (subregion_id, recipient_email) values
  ('20000000-0000-0000-0000-000000000001', 'src-sr1@example.test'),
  ('20000000-0000-0000-0000-000000000002', 'src-sr2@example.test');

create temporary table r (label text primary key, result jsonb) on commit drop;
create function pg_temp.uid(l text) returns uuid language sql as $$ select (result ->> 'user_id')::uuid from r where label = l $$;
create function pg_temp.sid(l text) returns uuid language sql as $$ select (result ->> 'submission_id')::uuid from r where label = l $$;

-- 1. New person, active path ---------------------------------------------
insert into r select 'first', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Hana', 'last_name', 'Testcase', 'email', 'Hana@Example.test',
  'phone', '(555) 555-0199', 'neighbor_net_id', '30000000-0000-0000-0000-000000000002',
  'involvement', 'active_leadership',
  'current_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000002'),
    jsonb_build_object('team_id', '50000000-0000-0000-0000-000000000001')),
  'previous_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000001', 'from_year', 2023, 'to_year', 2025)),
  'tags', jsonb_build_array(
    jsonb_build_object('kind', 'skill', 'id', '60000000-0000-0000-0000-000000000001'),
    jsonb_build_object('kind', 'skill', 'label', '  pgtap   custom skill '),
    jsonb_build_object('kind', 'organization', 'label', 'msa')),
  'answers', jsonb_build_object('birthday', '2002-02-02')));

select is((select result ->> 'identity_match' from r where label = 'first'), 'new', 'new person is created');
select is((select count(*)::int from public.users where lower(email) = 'hana@example.test'), 1, 'one profile for the email');
select is(
  (select array[region_id::text, subregion_id::text] from public.users where id = pg_temp.uid('first')),
  array['10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'],
  'SR and region derived from the NeighborNet');
select is((select result ->> 'notification_status' from r where label = 'first'), 'queued', 'SRC notification queued');
select is(
  (select recipient_email from public.notification_deliveries where submission_id = pg_temp.sid('first')),
  'src-sr1@example.test', 'routed to the submitter''s subregion SRC group');
select is(
  (select count(*)::int from public.role_assignments where user_id = pg_temp.uid('first') and superseded_at is null and is_current),
  2, 'each current position (role or team) is stored separately');
select is(
  (select array[from_year, to_year] from public.role_assignments where user_id = pg_temp.uid('first') and not is_current),
  array[2023, 2025]::smallint[], 'previous position keeps its years');
select is(
  (select is_approved from public.profile_tags where kind = 'skill' and label = 'pgtap custom skill'),
  false, 'typed-in skill is tidied and saved for IT review');
select is(
  (select count(*)::int from public.profile_tags where kind = 'organization' and lower(label) = 'msa'),
  1, 'typed-in entry reuses an existing tag with the same spelling');
select is(
  (select count(*)::int from public.user_profile_tags where user_id = pg_temp.uid('first')),
  3, 'all tags attached to the profile');
select is(
  (select involvement || '/' || involvement_year from public.users where id = pg_temp.uid('first')),
  'active_leadership/2027', 'directory status set for this cycle');

-- 2. Returning person, same cycle, switches to Cloud ----------------------
insert into r select 'again', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Hana', 'last_name', 'Testcase', 'email', 'hana@example.test ',
  'subregion_id', '20000000-0000-0000-0000-000000000002', 'involvement', 'cloud',
  'previous_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000002', 'from_year', 2027, 'to_year', 2027)),
  'answers', '{}'::jsonb));

select is(pg_temp.uid('again'), pg_temp.uid('first'), 'returning person reuses the same UUID');
select is((select result ->> 'identity_match' from r where label = 'again'), 'email_match', 'matched by email (case/space-insensitive)');
select is((select (result ->> 'revision')::int from r where label = 'again'), 2, 'resubmission is revision 2');
select is((select count(*)::int from public.annual_submissions where user_id = pg_temp.uid('first')), 2, 'revision 1 is kept');
select is(
  (select count(*)::int from public.role_assignments where user_id = pg_temp.uid('first') and superseded_at is not null),
  3, 'earlier positions kept as history');
select ok(
  (select neighbor_net_id is null and subregion_id = '20000000-0000-0000-0000-000000000002'
   from public.users where id = pg_temp.uid('first')),
  'directory profile updated immediately');
select is(
  (select count(*)::int from public.user_profile_tags where user_id = pg_temp.uid('first')),
  0, 'tags replaced by the latest submission');

-- 3. Cloud is per year -----------------------------------------------------
insert into r select 'next_year', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2028, 'first_name', 'Hana', 'last_name', 'Testcase', 'email', 'hana@example.test',
  'subregion_id', '20000000-0000-0000-0000-000000000002', 'involvement', 'active_leadership',
  'current_positions', jsonb_build_array(jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000001')),
  'answers', '{}'::jsonb));
select is(
  (select involvement from public.annual_submissions where id = pg_temp.sid('next_year')),
  'active_leadership', 'Cloud is not carried into the next year');

-- 4. No SRC route, and region-only answers -------------------------------
insert into r select 'no_route', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Iman', 'last_name', 'Noroute', 'email', 'iman@example.test',
  'subregion_id', '20000000-0000-0000-0000-000000000003', 'involvement', 'cloud', 'answers', '{}'::jsonb));
select is((select result ->> 'notification_status' from r where label = 'no_route'), 'no_route', 'missing route is recorded for IT');

insert into r select 'region_only', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Lina', 'last_name', 'Regiononly', 'email', 'lina@example.test',
  'region_id', '10000000-0000-0000-0000-000000000002', 'involvement', 'cloud', 'answers', '{}'::jsonb));
select is((select result ->> 'notification_status' from r where label = 'region_only'), 'no_route', 'region-only answer has no SRC group');

-- 5. Possible duplicate: same name, different email -----------------------
insert into r select 'dup', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'hana', 'last_name', 'TESTCASE', 'email', 'hana.other@example.test',
  'subregion_id', '20000000-0000-0000-0000-000000000001', 'involvement', 'cloud', 'answers', '{}'::jsonb));
select is((select result ->> 'identity_match' from r where label = 'dup'), 'possible_duplicate', 'same name, new email is flagged');
select isnt(pg_temp.uid('dup'), pg_temp.uid('first'), 'flagged duplicate is not auto-merged');

-- 6. Rejections leave nothing behind --------------------------------------
select throws_ok(
  $$select public.submit_annual_form(jsonb_build_object(
      'cycle_year', 2027, 'first_name', 'Jana', 'last_name', 'Rollback', 'email', 'jana@example.test',
      'subregion_id', '20000000-0000-0000-0000-000000000001', 'involvement', 'cloud',
      'tags', jsonb_build_array(jsonb_build_object('kind', 'skill', 'id', '61000000-0000-0000-0000-000000000001')),
      'answers', '{}'::jsonb))$$,
  '22023', null, 'interest id submitted as a skill is rejected');
select is((select count(*)::int from public.users where email = 'jana@example.test'), 0, 'rejected submission created no profile');
select throws_ok(
  $$select public.submit_annual_form(jsonb_build_object(
      'cycle_year', 2027, 'first_name', 'Jana', 'last_name', 'Rollback', 'email', 'jana@example.test',
      'subregion_id', '20000000-0000-0000-0000-000000000001', 'involvement', 'active_leadership',
      'answers', '{}'::jsonb))$$,
  '22023', null, 'active path without a current position is rejected');
select throws_ok(
  $$select public.submit_annual_form(jsonb_build_object(
      'cycle_year', 2027, 'first_name', 'Jana', 'last_name', 'Rollback', 'email', 'jana@example.test',
      'subregion_id', '20000000-0000-0000-0000-000000000003', 'neighbor_net_id', '30000000-0000-0000-0000-000000000001',
      'involvement', 'cloud', 'answers', '{}'::jsonb))$$,
  '22023', null, 'NeighborNet from another subregion is rejected');

select throws_ok(
  $$select public.submit_annual_form(jsonb_build_object(
      'cycle_year', 2027, 'first_name', 'Jana', 'last_name', 'Rollback', 'email', 'jana@example.test',
      'subregion_id', '20000000-0000-0000-0000-000000000004', 'neighbor_net_id', '30000000-0000-0000-0000-000000000005',
      'involvement', 'cloud', 'answers', '{}'::jsonb))$$,
  '22023', null, 'region NeighborNet with a subregion is rejected');
select throws_ok(
  $$select public.submit_annual_form(jsonb_build_object(
      'cycle_year', 2027, 'first_name', 'Jana', 'last_name', 'Rollback', 'email', 'jana@example.test',
      'involvement', 'cloud', 'answers', '{}'::jsonb))$$,
  '22023', null, 'missing SR / Region is rejected');

-- Region NeighborNets and subregions without a region
insert into r select 'region_nn', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Mina', 'last_name', 'Regionnn', 'email', 'mina@example.test',
  'region_id', '10000000-0000-0000-0000-000000000002', 'neighbor_net_id', '30000000-0000-0000-0000-000000000005',
  'involvement', 'cloud', 'answers', '{}'::jsonb));
select ok(
  (select subregion_id is null and region_id = '10000000-0000-0000-0000-000000000002'
     and neighbor_net_id = '30000000-0000-0000-0000-000000000005'
   from public.users where id = pg_temp.uid('region_nn')),
  'region NeighborNet is accepted');
insert into r select 'sr_only', public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Nora', 'last_name', 'Sronly', 'email', 'nora@example.test',
  'subregion_id', '20000000-0000-0000-0000-000000000004', 'involvement', 'cloud', 'answers', '{}'::jsonb));
select ok(
  (select region_id is null and subregion_id = '20000000-0000-0000-0000-000000000004'
   from public.users where id = pg_temp.uid('sr_only')),
  'subregion without a region is accepted');

-- 7. Idempotency key ------------------------------------------------------
select throws_ok(
  format($$insert into public.notification_deliveries (submission_id, kind, recipient_email, status)
           values (%L, 'src_group', 'x@example.test', 'queued')$$, pg_temp.sid('first')),
  '23505', null, 'only one SRC notification per submission');

select * from finish();
rollback;
