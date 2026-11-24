-- LOCAL DEVELOPMENT SEED. Fictional people only; never real names or SRC addresses.
-- Runs after the files in seeds/ on `supabase db reset`.
-- It is NOT pushed to the hosted project by `supabase db push`.

-- SRC routes: example.test is a reserved, non-deliverable domain. Other
-- subregions have no route so the "no route" state can be demonstrated.
insert into public.src_email_routes (subregion_id, recipient_email)
select s.id, v.email
from (values ('NJC', 'src-njc@example.test'), ('DALLAS', 'src-dallas@example.test')) as v (code, email)
join public.subregions s on s.code = v.code;

-- Fictional submissions, through the real intake function -----------------
select public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Amira', 'last_name', 'Example', 'email', 'amira@example.test',
  'phone', '(555) 555-0101', 'state', 'New Jersey',
  'subregion_id', (select id from public.subregions where code = 'NJC'), 'neighbor_net_id', (select id from public.neighbor_nets where code = 'NJC-EDISON'),
  'involvement', 'active_leadership',
  'current_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000002', 'subregion_id', (select id from public.subregions where code = 'NJC')),
    jsonb_build_object('team_id', '50000000-0000-0000-0000-000000000001')),
  'previous_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000001', 'neighbor_net_id', (select id from public.neighbor_nets where code = 'NJC-EDISON'), 'from_year', 2024, 'to_year', 2025)),
  'tags', jsonb_build_array(
    jsonb_build_object('kind', 'skill', 'id', '60000000-0000-0000-0000-000000000001'),
    jsonb_build_object('kind', 'skill', 'id', (select id from public.profile_tags where kind = 'skill' and label = 'Video Editing')),
    jsonb_build_object('kind', 'interest', 'id', (select id from public.profile_tags where kind = 'interest' and label = 'Conferences (YMC)')),
    jsonb_build_object('kind', 'school', 'id', (select id from public.profile_tags where kind = 'school' and label = 'Princeton University')),
    jsonb_build_object('kind', 'organization', 'id', (select id from public.profile_tags where kind = 'organization' and label = 'MSA'))),
  'answers', jsonb_build_object('birthday', '2003-04-12', 'ethnicity', jsonb_build_array('Pakistani'),
                                'education_status', jsonb_build_array('Undergraduate'), 'note', 'fictional')));

select public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Bushra', 'last_name', 'Sample', 'email', 'bushra@example.test',
  'phone', '(555) 555-0102', 'state', 'Texas',
  'neighbor_net_id', (select id from public.neighbor_nets where code = 'DALLAS-IRVING'),
  'involvement', 'active_leadership',
  'current_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000001', 'neighbor_net_id', (select id from public.neighbor_nets where code = 'DALLAS-IRVING'))),
  'tags', jsonb_build_array(
    jsonb_build_object('kind', 'skill', 'id', (select id from public.profile_tags where kind = 'skill' and label = 'Event Planning')),
    jsonb_build_object('kind', 'skill', 'label', 'Calligraphy'),
    jsonb_build_object('kind', 'interest', 'id', (select id from public.profile_tags where kind = 'interest' and label = 'Outreach')),
    jsonb_build_object('kind', 'occupation', 'id', (select id from public.profile_tags where kind = 'occupation' and label = 'Software Engineer'))),
  'answers', jsonb_build_object('birthday', '2004-09-30', 'note', 'fictional')));

select public.submit_annual_form(jsonb_build_object(
  'cycle_year', 2027, 'first_name', 'Dalia', 'last_name', 'Placeholder', 'email', 'dalia@example.test',
  'phone', '(555) 555-0103', 'state', 'Georgia', 'subregion_id', (select id from public.subregions where code = 'GEORGIA'),
  'involvement', 'cloud',
  'previous_positions', jsonb_build_array(
    jsonb_build_object('role_type_id', '40000000-0000-0000-0000-000000000002', 'from_year', 2022, 'to_year', 2024)),
  'tags', jsonb_build_array(jsonb_build_object('kind', 'interest', 'id', '61000000-0000-0000-0000-000000000001')),
  'answers', jsonb_build_object('note', 'fictional, Cloud path, SR with no SRC route')));
