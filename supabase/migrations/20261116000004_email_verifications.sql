-- One-time email codes for the public annual form (docs/README.md, "Email verification").
-- Proves the submitter controls the email they typed before a submission is
-- accepted. Not a login: no auth user or account is created.
-- Only the server (service_role) touches this table. Codes are stored hashed.

create table public.email_verifications (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email = lower(email)),
  code_hash   text not null,
  attempts    integer not null default 0,
  expires_at  timestamptz not null,
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);
create index email_verifications_email_idx on public.email_verifications (email, created_at desc);

alter table public.email_verifications enable row level security;
-- No policies and no grants: anon/authenticated can never read or write it.
revoke all on public.email_verifications from anon, authenticated;
