-- Access control: grants + Row Level Security. See docs/ARCHITECTURE.md section 5.
--
-- Phase 1: no member login. Anonymous visitors may only read the form's
-- reference lists. Submissions are written server-side through
-- public.submit_annual_form (service_role only). Only IT admins can read
-- people, submissions, notification status and routing.
-- Phase 2: platform_role = 'member' unlocks the directory tables (read-only).

-- Start from nothing, then grant explicitly.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Identity helpers (SECURITY DEFINER so they can read users under RLS)
-- ---------------------------------------------------------------------------

create or replace function private.current_platform_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.platform_role from public.users u where u.auth_id = auth.uid()),
    'none'
  );
$$;

create or replace function private.is_it_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_platform_role() = 'it_admin';
$$;

create or replace function private.can_view_directory()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_platform_role() in ('member', 'it_admin');
$$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.current_platform_role(), private.is_it_admin(), private.can_view_directory()
  to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

alter table public.regions                 enable row level security;
alter table public.subregions              enable row level security;
alter table public.neighbor_nets           enable row level security;
alter table public.src_email_routes        enable row level security;
alter table public.teams                   enable row level security;
alter table public.role_types              enable row level security;
alter table public.profile_tags            enable row level security;
alter table public.users                   enable row level security;
alter table public.user_profile_tags       enable row level security;
alter table public.annual_submissions      enable row level security;
alter table public.role_assignments        enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_log               enable row level security;

-- ---------------------------------------------------------------------------
-- Reference data: readable by everyone (the public form needs the lists)
-- ---------------------------------------------------------------------------

grant select on public.regions, public.subregions, public.neighbor_nets,
                public.teams, public.role_types, public.profile_tags
  to anon, authenticated;

create policy "reference readable" on public.regions       for select to anon, authenticated using (true);
create policy "reference readable" on public.subregions    for select to anon, authenticated using (true);
create policy "reference readable" on public.neighbor_nets for select to anon, authenticated using (true);
create policy "reference readable" on public.teams         for select to anon, authenticated using (is_active);
create policy "reference readable" on public.role_types    for select to anon, authenticated using (is_active);
-- Public form suggestions: approved tags only (typed-in entries from other
-- people stay hidden until IT approves them). Directory viewers also see
-- unapproved tags so a person's own entries show on their profile.
create policy "approved tags readable" on public.profile_tags
  for select to anon, authenticated using (is_active and is_approved);
create policy "directory sees all tags" on public.profile_tags
  for select to authenticated using (is_active and (select private.can_view_directory()));

-- ---------------------------------------------------------------------------
-- Directory tables: members (Phase 2) and IT admins, read-only
-- ---------------------------------------------------------------------------

grant select on public.users, public.user_profile_tags, public.role_assignments to authenticated;

create policy "directory readable" on public.users
  for select to authenticated using ((select private.can_view_directory()));
create policy "directory readable" on public.user_profile_tags
  for select to authenticated using ((select private.can_view_directory()));
create policy "directory readable" on public.role_assignments
  for select to authenticated using ((select private.can_view_directory()));

-- ---------------------------------------------------------------------------
-- IT-only tables
-- ---------------------------------------------------------------------------

grant select on public.annual_submissions, public.notification_deliveries, public.audit_log
  to authenticated;
grant select, insert, update, delete on public.src_email_routes to authenticated;

create policy "it admin reads" on public.annual_submissions
  for select to authenticated using ((select private.is_it_admin()));
create policy "it admin reads" on public.notification_deliveries
  for select to authenticated using ((select private.is_it_admin()));
create policy "it admin reads" on public.audit_log
  for select to authenticated using ((select private.is_it_admin()));
create policy "it admin manages" on public.src_email_routes
  for all to authenticated
  using ((select private.is_it_admin()))
  with check ((select private.is_it_admin()));

-- All other writes (submissions, profile updates, corrections, delivery status)
-- go through SECURITY DEFINER functions that validate and audit.
