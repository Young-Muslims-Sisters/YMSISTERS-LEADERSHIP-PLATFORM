-- Matches how YM is organized: subregions are not nested in regions, and a
-- NeighborNet belongs to either a subregion or a region (grouped by state).

alter table public.subregions alter column region_id drop not null;

alter table public.neighbor_nets
  alter column subregion_id drop not null,
  add column region_id uuid references public.regions (id),
  add column state text,
  add constraint neighbor_nets_one_parent check (num_nonnulls(subregion_id, region_id) = 1);
create index neighbor_nets_region_id_idx on public.neighbor_nets (region_id);

-- Same intake function as before; only the location rules changed.
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

    insert into public.user_profile_tags (user_id, tag_id)
    values (v_user_id, v_tag_id)
    on conflict do nothing;
    v_tag_id := null;
  end loop;

  -- ---- 4. Positions: this submission's list replaces the earlier list ----
  update public.role_assignments
  set superseded_at = now()
  where user_id = v_user_id and superseded_at is null;

  insert into public.role_assignments (
    user_id, role_type_id, team_id, region_id, subregion_id, neighbor_net_id,
    is_current, from_year, to_year, source_submission_id
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
    v_submission_id
  from (
    select value, true as is_current from jsonb_array_elements(v_current)
    union all
    select value, false from jsonb_array_elements(v_previous)
  ) p;

  -- ---- 5. Queue the SRC group notification (outbox) -----------------------
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
