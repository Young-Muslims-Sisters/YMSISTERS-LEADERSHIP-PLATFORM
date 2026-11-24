-- YM Sisters Leadership Platform: core schema
-- See docs/ARCHITECTURE.md section 3. Names follow Brothers concepts where known
-- (users.id + users.auth_id, role_types/role_assignments, geography hierarchy).
-- Revalidate against the latest Brothers schema before production (docs/ARCHITECTURE.md).

-- Helpers that must not be exposed through the Data API live in `private`.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organization reference data
-- ---------------------------------------------------------------------------

create table public.regions (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.subregions (
  id         uuid primary key default gen_random_uuid(),
  region_id  uuid not null references public.regions (id),
  code       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);
create index subregions_region_id_idx on public.subregions (region_id);

create table public.neighbor_nets (
  id           uuid primary key default gen_random_uuid(),
  subregion_id uuid not null references public.subregions (id),
  code         text not null unique,
  name         text not null,
  created_at   timestamptz not null default now()
);
create index neighbor_nets_subregion_id_idx on public.neighbor_nets (subregion_id);

-- SRC group email routing, one current recipient per subregion. Kept out of
-- `subregions` because subregions are publicly readable for the form and
-- recipient addresses are IT-only.
create table public.src_email_routes (
  subregion_id    uuid primary key references public.subregions (id) on delete cascade,
  recipient_email text not null check (recipient_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  updated_at      timestamptz not null default now()
);
create trigger src_email_routes_updated_at before update on public.src_email_routes
  for each row execute function private.set_updated_at();

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  scope      text not null check (scope in ('national', 'region', 'subregion', 'neighbor_net')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.role_types (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  -- Matches the form's position dropdown groups: NN, SR, National, (National teams = teams), Other.
  scope_level text not null check (scope_level in ('national', 'region', 'subregion', 'neighbor_net', 'other')),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Searchable multi-value profile attributes. The form lets people pick from the
-- list or type their own; typed entries are stored with is_approved = false
-- until IT reviews them (Figma: "Skills dropdown / data source" note).
create table public.profile_tags (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('skill', 'interest', 'school', 'field_of_study', 'occupation', 'organization')),
  label       text not null check (length(trim(label)) > 0),
  is_approved boolean not null default true,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index profile_tags_kind_label_key on public.profile_tags (kind, lower(label));

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

-- Permanent person record. `id` is the immutable identity; email is contact
-- info used for returning-person matching, never the primary key.
-- Holds only directory-safe fields. Sensitive answers (birthday, ethnicity,
-- etc.) live only in annual_submissions.answers.
create table public.users (
  id              uuid primary key default gen_random_uuid(),
  auth_id         uuid unique references auth.users (id) on delete set null,
  first_name      text not null check (length(trim(first_name)) > 0),
  last_name       text not null check (length(trim(last_name)) > 0),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone           text,
  state           text,
  -- The form asks for "SR / Region": a subregion, or only a region.
  region_id       uuid references public.regions (id),
  subregion_id    uuid references public.subregions (id),
  neighbor_net_id uuid references public.neighbor_nets (id),
  -- Directory status (Active / Cloud) for the cycle it was submitted in.
  -- Copied from the latest submission; only meaningful when involvement_year
  -- is the current cycle (Cloud is never carried forward).
  involvement      text check (involvement in ('active_leadership', 'cloud')),
  involvement_year smallint,
  -- 'none': has a profile but no platform access (Phase 1 default for everyone)
  -- 'member': may sign in and view the directory (Phase 2)
  -- 'it_admin': full IT access
  platform_role   text not null default 'none' check (platform_role in ('none', 'member', 'it_admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index users_email_key on public.users (lower(email));
create index users_name_idx on public.users (lower(last_name), lower(first_name));
create index users_subregion_id_idx on public.users (subregion_id);
create trigger users_updated_at before update on public.users
  for each row execute function private.set_updated_at();

create table public.user_profile_tags (
  user_id uuid not null references public.users (id) on delete cascade,
  tag_id  uuid not null references public.profile_tags (id),
  primary key (user_id, tag_id)
);
create index user_profile_tags_tag_id_idx on public.user_profile_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Annual submissions
-- ---------------------------------------------------------------------------

-- Every accepted form submission is kept. A returning person's resubmission in
-- the same cycle gets the next revision number; nothing is overwritten.
create table public.annual_submissions (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.users (id),
  cycle_year                 smallint not null check (cycle_year between 2027 and 2100),
  revision                   integer not null default 1 check (revision >= 1),
  -- "How are you involved with YM in <year>?" Single choice. Choosing Cloud is
  -- the explicit yearly Cloud confirmation; it is never copied forward.
  involvement                text not null check (involvement in ('active_leadership', 'cloud')),
  -- Full raw answers, including sensitive fields. IT-only.
  answers                    jsonb not null,
  identity_match             text not null check (identity_match in ('new', 'email_match', 'possible_duplicate')),
  possible_duplicate_user_id uuid references public.users (id),
  submitted_at               timestamptz not null default now(),
  unique (user_id, cycle_year, revision)
);
create index annual_submissions_cycle_idx on public.annual_submissions (cycle_year, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

-- Positions a person reported: current ones (is_current) and previous ones
-- (with From/To years). Each submission's list supersedes the earlier list
-- (superseded_at set, never deleted), so every year's answers stay traceable.
-- A position is a role, a national team, or both (form dropdown mixes them).
create table public.role_assignments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.users (id) on delete cascade,
  role_type_id         uuid references public.role_types (id),
  team_id              uuid references public.teams (id),
  region_id            uuid references public.regions (id),
  subregion_id         uuid references public.subregions (id),
  neighbor_net_id      uuid references public.neighbor_nets (id),
  is_current           boolean not null,
  from_year            smallint check (from_year between 1950 and 2100),
  to_year              smallint check (to_year between 1950 and 2100),
  source_submission_id uuid references public.annual_submissions (id),
  superseded_at        timestamptz,
  created_at           timestamptz not null default now(),
  check (role_type_id is not null or team_id is not null),
  check (to_year is null or from_year is null or to_year >= from_year)
);
create index role_assignments_live_idx on public.role_assignments (user_id) where superseded_at is null;
create index role_assignments_team_idx on public.role_assignments (team_id);
create index role_assignments_role_type_idx on public.role_assignments (role_type_id);

-- ---------------------------------------------------------------------------
-- Notifications (outbox)
-- ---------------------------------------------------------------------------

-- One row per submission per notification kind: the idempotency key.
-- 'no_route' = no SRC group address configured for the subregion; IT must act.
create table public.notification_deliveries (
  id                  uuid primary key default gen_random_uuid(),
  submission_id       uuid not null references public.annual_submissions (id),
  kind                text not null default 'src_group' check (kind in ('src_group')),
  subregion_id        uuid references public.subregions (id),
  recipient_email     text,
  status              text not null check (status in ('queued', 'sending', 'sent', 'failed', 'no_route')),
  attempts            integer not null default 0,
  last_error          text,
  next_attempt_at     timestamptz not null default now(),
  sent_at             timestamptz,
  provider_message_id text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (submission_id, kind),
  check ((status = 'no_route') = (recipient_email is null))
);
create index notification_deliveries_pending_idx on public.notification_deliveries (next_attempt_at)
  where status in ('queued', 'failed');
create trigger notification_deliveries_updated_at before update on public.notification_deliveries
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit trail for administrative corrections and identity merges
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id            bigint generated always as identity primary key,
  actor_user_id uuid references public.users (id),
  action        text not null,
  entity        text not null,
  entity_id     uuid,
  details       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);
