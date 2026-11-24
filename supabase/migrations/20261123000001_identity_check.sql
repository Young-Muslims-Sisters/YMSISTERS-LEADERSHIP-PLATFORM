-- Replaces one-time email codes: a returning person is recognized by email plus
-- date of birth (docs/README.md, "Returning people"). Failed matches are logged
-- so repeated date-of-birth guesses can be blocked.

drop table public.email_verifications;

create table public.identity_mismatches (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (email = lower(email)),
  created_at timestamptz not null default now()
);
create index identity_mismatches_email_idx on public.identity_mismatches (email, created_at desc);

alter table public.identity_mismatches enable row level security;
-- No policies and no grants: only the server (service_role) uses this table.
revoke all on public.identity_mismatches from anon, authenticated;
