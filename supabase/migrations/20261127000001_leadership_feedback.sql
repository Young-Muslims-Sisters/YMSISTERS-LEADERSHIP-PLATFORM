-- Feedback from leadership (2026-11-27):
--   * Shura roles name their portfolio, and team members their position on the team.
--   * Organizations say what the person did there.
--   * The form asks for a YM email and an optional mailing address, which only
--     IT and the National Shura can see.
--   * New Jersey subregions are written out, and New York splits into East and West.

-- Positions ------------------------------------------------------------------
alter table public.role_types add column has_portfolio boolean not null default false;
update public.role_types set has_portfolio = true where code in ('NN_SHURA', 'SR_SHURA', 'NS');

-- A shura portfolio is a department (portfolio_team_id) or typed in (title_detail).
-- On a team, team_title is the position; title_detail names what a Lead leads.
alter table public.role_assignments
  add column portfolio_team_id uuid references public.teams (id),
  add column team_title text check (team_title in ('chair', 'co_chair', 'lead', 'member', 'other')),
  add column title_detail text check (length(title_detail) <= 100);

-- Organizations ----------------------------------------------------------------
alter table public.user_profile_tags
  add column role text check (length(role) <= 100),
  add column details text check (length(details) <= 1000);

-- YM email and mailing address -------------------------------------------------
create table private.national_shura (
  email text primary key check (email = lower(email))
);
-- To add someone:  insert into private.national_shura values ('name@ymsisters.com');

create table public.user_private_details (
  user_id         uuid primary key references public.users (id) on delete cascade,
  ym_email_status text check (ym_email_status in ('has', 'needs', 'not_needed')),
  ym_email        text check (ym_email ~* '^[^@\s]+@ymsisters\.com$'),
  address_line1   text check (length(address_line1) <= 200),
  address_line2   text check (length(address_line2) <= 200),
  city            text check (length(city) <= 100),
  state           text check (length(state) <= 100),
  postal_code     text check (postal_code ~ '^\d{5}(-\d{4})?$'),
  updated_at      timestamptz not null default now()
);
create trigger user_private_details_updated_at before update on public.user_private_details
  for each row execute function private.set_updated_at();

-- IT, or a listed National Shura account signed in with the same checks as my_access().
create function private.can_view_private_details()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_it_admin() or exists (
    select 1
    from auth.identities i
    join private.allowed_domains d
      on d.domain = split_part(lower(i.identity_data ->> 'email'), '@', 2)
    join private.allowed_domains w
      on w.domain = lower(i.identity_data #>> '{custom_claims,hd}')
    join private.national_shura s on s.email = lower(i.identity_data ->> 'email')
    where i.user_id = (select auth.uid())
      and i.provider = 'google'
      and (i.identity_data ->> 'email_verified')::boolean
      and (auth.jwt() #>> '{amr,0,timestamp}')::bigint > extract(epoch from now() - interval '7 days')
  );
$$;
revoke all on function private.can_view_private_details() from public, anon;
grant execute on function private.can_view_private_details() to authenticated;

alter table public.user_private_details enable row level security;
revoke all on public.user_private_details from anon, authenticated;
grant select on public.user_private_details to authenticated;
create policy "IT and National Shura read" on public.user_private_details
  for select to authenticated using ((select private.can_view_private_details()));

-- Locations (no-ops on an empty database; seeds/reference.sql has the same names) --
update public.subregions set name = 'New Jersey North' where code = 'NJN';
update public.subregions set name = 'New Jersey Central' where code = 'NJC';
update public.subregions set name = 'New Jersey South' where code = 'NJS';

-- New York splits. Long Island is East; New York City and Westchester are West.
update public.subregions set code = 'NY-EAST', name = 'New York East' where code = 'NEW-YORK';
insert into public.subregions (code, name)
select 'NY-WEST', 'New York West' where exists (select 1 from public.subregions where code = 'NY-EAST')
on conflict (code) do nothing;
update public.neighbor_nets set subregion_id = (select id from public.subregions where code = 'NY-WEST')
where code in ('NEW-YORK-FLUSHING', 'NEW-YORK-JAMAICA', 'NEW-YORK-KENSINGTON', 'NEW-YORK-WESTCHESTER');
-- People and positions follow their NeighborNet.
update public.users u set subregion_id = n.subregion_id
from public.neighbor_nets n where u.neighbor_net_id = n.id and u.subregion_id is distinct from n.subregion_id;
update public.role_assignments r set subregion_id = n.subregion_id
from public.neighbor_nets n
where r.neighbor_net_id = n.id and r.subregion_id is not null and r.subregion_id is distinct from n.subregion_id;

-- Intake: same as before, plus position details, organization details and private details.
create or replace function public.submit_annual_form(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email          text := lower(trim(payload ->> 'email'));
  v_first          text := trim(payload ->> 'first_name');
  v_last           text := trim(payload ->> 'last_name');
  v_year           smallint := (payload ->> 'cycle_year')::smallint;
  v_involvement    text := payload ->> 'involvement';
  v_region_id      uuid := nullif(payload ->> 'region_id', '')::uuid;
  v_subregion_id   uuid := nullif(payload ->> 'subregion_id', '')::uuid;
  v_nn_id          uuid := nullif(payload ->> 'neighbor_net_id', '')::uuid;
  v_current        jsonb := coalesce(payload -> 'current_positions', '[]');
  v_previous       jsonb := coalesce(payload -> 'previous_positions', '[]');
  v_user_id        uuid;
  v_match          text;
  v_dup_id         uuid;
  v_revision       integer;
  v_submission_id  uuid;
  v_recipient      text;
  v_status         text;
  v_tag            jsonb;
  v_tag_id         uuid;
  v_label          text;
  v_parent         uuid;
  v_nn             public.neighbor_nets;
  v_private        jsonb := payload -> 'private';
begin
  -- ---- Validate ---------------------------------------------------------
  if coalesce(v_email, '') = '' or coalesce(v_first, '') = '' or coalesce(v_last, '') = '' then
    raise exception 'first_name, last_name and email are required' using errcode = '22023';
  end if;
  if v_year is null then
    raise exception 'cycle_year is required' using errcode = '22023';
  end if;
  if v_involvement is null or v_involvement not in ('active_leadership', 'cloud') then
    raise exception 'involvement must be active_leadership or cloud' using errcode = '22023';
  end if;
  if jsonb_typeof(payload -> 'answers') is distinct from 'object' then
    raise exception 'answers must be an object' using errcode = '22023';
  end if;
  if v_involvement = 'active_leadership' and jsonb_array_length(v_current) = 0 then
    raise exception 'active leadership requires at least one current position' using errcode = '22023';
  end if;
  if v_involvement = 'cloud' and jsonb_array_length(v_current) > 0 then
    raise exception 'the Cloud path has no current positions' using errcode = '22023';
  end if;

  -- Location: a NeighborNet implies its subregion or region. Must be consistent.
  if v_nn_id is not null then
    select * into v_nn from public.neighbor_nets nn where nn.id = v_nn_id;
    if not found
      or (v_subregion_id is not null and v_subregion_id is distinct from v_nn.subregion_id)
      or (v_region_id is not null and v_nn.region_id is not null and v_region_id <> v_nn.region_id) then
      raise exception 'NeighborNet does not belong to the selected SR / Region' using errcode = '22023';
    end if;
    v_subregion_id := v_nn.subregion_id;
    v_region_id := coalesce(v_nn.region_id, v_region_id);
  end if;
  if v_subregion_id is not null then
    select s.region_id into v_parent from public.subregions s where s.id = v_subregion_id;
    if not found or (v_region_id is not null and v_region_id is distinct from v_parent) then
      raise exception 'subregion does not belong to the selected region' using errcode = '22023';
    end if;
    v_region_id := v_parent;
  end if;
  if v_region_id is null and v_subregion_id is null then
    raise exception 'SR / Region is required' using errcode = '22023';
  end if;

  -- ---- 1. Resolve the permanent person (same email = returning person) ------
  select u.id into v_user_id
  from public.users u
  where lower(u.email) = v_email
  for update;

  if found then
    v_match := 'email_match';
    update public.users set
      first_name       = v_first,
      last_name        = v_last,
      phone            = nullif(trim(payload ->> 'phone'), ''),
      state            = nullif(trim(payload ->> 'state'), ''),
      region_id        = v_region_id,
      subregion_id     = v_subregion_id,
      neighbor_net_id  = v_nn_id,
      involvement      = v_involvement,
      involvement_year = v_year
    where id = v_user_id;
  else
    -- Same name under a different email: create the person but flag for IT.
    -- Never auto-merge.
    select u.id into v_dup_id
    from public.users u
    where lower(u.first_name) = lower(v_first)
      and lower(u.last_name)  = lower(v_last)
    order by u.created_at
    limit 1;

    v_match := case when v_dup_id is null then 'new' else 'possible_duplicate' end;

    insert into public.users (
      first_name, last_name, email, phone, state,
      region_id, subregion_id, neighbor_net_id, involvement, involvement_year
    ) values (
      v_first, v_last, v_email,
      nullif(trim(payload ->> 'phone'), ''),
      nullif(trim(payload ->> 'state'), ''),
      v_region_id, v_subregion_id, v_nn_id, v_involvement, v_year
    )
    returning id into v_user_id;
  end if;

  -- ---- 2. Store the submission (next revision for this person and cycle) --
  select coalesce(max(s.revision), 0) + 1 into v_revision
  from public.annual_submissions s
  where s.user_id = v_user_id and s.cycle_year = v_year;

  insert into public.annual_submissions (
    user_id, cycle_year, revision, involvement, answers, identity_match, possible_duplicate_user_id
  ) values (
    v_user_id, v_year, v_revision, v_involvement, payload -> 'answers', v_match, v_dup_id
  )
  returning id into v_submission_id;

  -- ---- 3. Tags: replace with this submission's selections -----------------
  delete from public.user_profile_tags where user_id = v_user_id;

  for v_tag in select * from jsonb_array_elements(coalesce(payload -> 'tags', '[]')) loop
    if v_tag ? 'id' then
      select pt.id into v_tag_id
      from public.profile_tags pt
      where pt.id = (v_tag ->> 'id')::uuid and pt.kind = v_tag ->> 'kind' and pt.is_active;
      if v_tag_id is null then
        raise exception 'unknown or mismatched % tag', v_tag ->> 'kind' using errcode = '22023';
      end if;
    else
      -- Typed-in entry: reuse an existing tag with the same spelling, otherwise
      -- add it unapproved for IT review.
      v_label := regexp_replace(trim(coalesce(v_tag ->> 'label', '')), '\s+', ' ', 'g');
      if v_label = '' or length(v_label) > 100 then
        raise exception 'custom entries must be 1-100 characters' using errcode = '22023';
      end if;
      insert into public.profile_tags (kind, label, is_approved)
      values (v_tag ->> 'kind', v_label, false)
      on conflict (kind, lower(label)) do nothing;
      select pt.id into v_tag_id
      from public.profile_tags pt
      where pt.kind = v_tag ->> 'kind' and lower(pt.label) = lower(v_label);
    end if;

    -- Organizations also say what the person did there.
    insert into public.user_profile_tags (user_id, tag_id, role, details)
    values (v_user_id, v_tag_id, nullif(trim(v_tag ->> 'role'), ''), nullif(trim(v_tag ->> 'details'), ''))
    on conflict do nothing;
    v_tag_id := null;
  end loop;

  -- ---- 4. Positions: this submission's list replaces the earlier list ----
  update public.role_assignments
  set superseded_at = now()
  where user_id = v_user_id and superseded_at is null;

  insert into public.role_assignments (
    user_id, role_type_id, team_id, region_id, subregion_id, neighbor_net_id,
    is_current, from_year, to_year, source_submission_id,
    portfolio_team_id, team_title, title_detail
  )
  select
    v_user_id,
    nullif(p.value ->> 'role_type_id', '')::uuid,
    nullif(p.value ->> 'team_id', '')::uuid,
    nullif(p.value ->> 'region_id', '')::uuid,
    nullif(p.value ->> 'subregion_id', '')::uuid,
    nullif(p.value ->> 'neighbor_net_id', '')::uuid,
    p.is_current,
    nullif(p.value ->> 'from_year', '')::smallint,
    nullif(p.value ->> 'to_year', '')::smallint,
    v_submission_id,
    nullif(p.value ->> 'portfolio_team_id', '')::uuid,
    nullif(p.value ->> 'team_title', ''),
    nullif(trim(p.value ->> 'title_detail'), '')
  from (
    select value, true as is_current from jsonb_array_elements(v_current)
    union all
    select value, false from jsonb_array_elements(v_previous)
  ) p;

  -- ---- 5. YM email and mailing address (IT and National Shura only) -------
  if jsonb_typeof(v_private) = 'object' then
    insert into public.user_private_details (
      user_id, ym_email_status, ym_email, address_line1, address_line2, city, state, postal_code
    ) values (
      v_user_id,
      nullif(v_private ->> 'ym_email_status', ''),
      nullif(lower(trim(v_private ->> 'ym_email')), ''),
      nullif(trim(v_private ->> 'address_line1'), ''),
      nullif(trim(v_private ->> 'address_line2'), ''),
      nullif(trim(v_private ->> 'city'), ''),
      nullif(trim(v_private ->> 'state'), ''),
      nullif(trim(v_private ->> 'postal_code'), '')
    )
    on conflict (user_id) do update set
      ym_email_status = excluded.ym_email_status,
      ym_email        = excluded.ym_email,
      address_line1   = excluded.address_line1,
      address_line2   = excluded.address_line2,
      city            = excluded.city,
      state           = excluded.state,
      postal_code     = excluded.postal_code;
  end if;

  -- ---- 6. Queue the SRC group notification (outbox) -----------------------
  -- Every submission, every path. Routed by subregion; a region-only
  -- answer has no SRC group and is recorded as no_route for IT.
  select r.recipient_email into v_recipient
  from public.src_email_routes r
  where r.subregion_id = v_subregion_id;

  v_status := case when v_recipient is null then 'no_route' else 'queued' end;

  insert into public.notification_deliveries (submission_id, kind, subregion_id, recipient_email, status)
  values (v_submission_id, 'src_group', v_subregion_id, v_recipient, v_status);

  return jsonb_build_object(
    'submission_id',       v_submission_id,
    'user_id',             v_user_id,
    'revision',            v_revision,
    'identity_match',      v_match,
    'notification_status', v_status
  );
end;
$$;

revoke all on function public.submit_annual_form(jsonb) from public, anon, authenticated;
grant execute on function public.submit_annual_form(jsonb) to service_role;
