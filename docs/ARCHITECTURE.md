# Technical Architecture

## 1. Guiding rules

1. **Brothers-compatible:** Reuse equivalent naming and concepts when practical. Do not copy unused Brothers features.
2. **Simple:** Prefer a small relational model and built-in platform capabilities over extra services and speculative abstractions.
3. **Clean:** Normalize identities, roles, geography, and skills. Keep one source of truth for each fact and preserve historical submissions.

## 2. Stack

| Layer | Choice |
|---|---|
| Language | TypeScript, strict mode |
| Web | React + Next.js App Router |
| Components/styling | Tailwind CSS, shadcn/ui primitives, custom YM design tokens |
| Data, authentication, policy enforcement | Supabase: PostgreSQL, Auth, Row Level Security (RLS) |
| Server operations | Server-side TypeScript for privileged actions; Supabase for database/auth |
| Email | Provider-neutral server-side adapter; choose an authorized transactional email provider during setup |
| Future mobile | React Native + Expo, sharing types, validation and backend contracts, not necessarily all web UI |
| Source control | GitHub |

Start with **web only**. Organize to allow `apps/mobile` later without requiring an immediate mobile project or complicated monorepo tooling.

Suggested layout:

```text
apps/web/               Next.js application
packages/shared/        Shared types and validation (if used by 2+ consumers)
supabase/migrations/     Versioned database schema and policies
supabase/tests/          RLS and database tests
docs/                    Product and architecture decisions
AGENTS.md                Agent instructions
```

Use the current compatible stable package versions at initialization, commit the lockfile, and document required environment variables in `.env.example`. Do not commit secrets.

## 3. Database design

**Identity:** Use `users.id UUID` as an immutable primary key (database-generated); `users.auth_id UUID NULL UNIQUE` links a record to Supabase Auth. Email is contact information, **not** the permanent ID. Align this pattern with Brothers' actual current schema before the first migration is finalized.

### Proposed minimum logical entities

| Entity | Role |
|---|---|
| `users` | Permanent profile, contact data, optional auth mapping and platform access state |
| `annual_submissions` | A user's 2027 form answers, submission timestamp, year, revision/status and intake metadata. Historical submissions remain available to IT. |
| `role_types` | Controlled vocabulary of leadership positions, including codes used by Brothers where compatible |
| `role_assignments` | User-to-role history; organizational scope, optional team, start/end dates. Supports concurrent positions. |
| `regions`, `subregions`, `neighbor_nets` | Organizational geography. A NeighborNet belongs to either a subregion or a region (region NNs are grouped by state); subregions are not nested in regions. A subregion maps to its current SRC group email routing |
| `teams` | Controlled national and other team names/scopes |
| `profile_tags`, `user_profile_tags` | Standardized multi-select skills and YM interests, via a `kind` field. Keep label aliases clean. |
| `invitations` | Secure, single-use/expiring invitation tracking for recipients and annual cycles |
| `notification_deliveries` | SRC email routing, idempotency, queued/sent/failed status, retry attempts, timestamps |

These are **logical entities**, not a mandate to add more tables. Use join tables when relationships are many-to-many. Avoid storing role lists or tags as comma-separated text.

**Keep private annual answers separate from the safe directory projection.** `annual_submissions.answers` may be JSONB for form-specific or sensitive answers while canonical searchable attributes use typed columns/relations. Specify a documented mapping from answers to the canonical profile. Do not put raw `answers` in directory queries.

**Annual state:** A verified returning person keeps the same `users.id`. Preserve year-specific submissions. A Cloud opt-in is explicitly recorded for the year and expires at the next annual cycle. Never infer Cloud opt-in solely from a historic role.

**Organization:** Adopt Brothers-compatible role and location codes where confirmed. Use foreign keys, not free-text SR/NN/role names, in canonical relationships. For future integrations, maintain a documented mapping of Brothers/Sisters IDs; do **not** assume independently generated UUIDs match across databases.

### Brothers compatibility checkpoint

Previously discussed Brothers concepts include `users` with `id` and optional `auth_id`, UUID keys, geographical hierarchy, role definitions/assignments, memberships, and cabinet teams. **The entire latest Brothers schema has not been revalidated.** Before freezing migrations, review the latest schema or repository and record how Sisters fields map to equivalent Brothers concepts. If `memberships` has no distinct meaning in the Sisters MVP, omit it rather than duplicating `role_assignments`.

## 4. Submission → directory → notifications

1. Accept the form through a secure invitation/verified existing account; validate data server-side.
2. Resolve the immutable person ID; prevent accidentally creating a second person for a returning member. Ambiguous identity matches must be flagged for IT rather than auto-merged.
3. **In one database transaction**, save the annual submission and update the canonical directory-safe profile/current role data. Keep an audit trail of changes.
4. Record a notification job in the same transaction (outbox pattern). **Submission success must not depend on SMTP/provider uptime.**
5. Route the email to the **SRC group address for the submitter's subregion**, for **every** successful submission, regardless of selected role or whether they chose Cloud. Notifications are informational, not approval requests.
6. Send via a server-side worker/job, log delivery state, retry transient failures idempotently. A retry must not send multiple notifications for one accepted submission event and intended recipient.
7. Show each accepted submission and its SRC email status on the IT Responses dashboard. Since submission persistence and directory update are atomic, do not show a routine “Directory Updated” status column. An unsuccessful transaction should return an error and not appear as an accepted submission. Missing recipient routing or delivery failures must appear as actionable IT issues.

**Proposed email content** (copy can be approved during integration):

> Subject: 2027 YM Sisters leadership submission: [Name] | [Subregion]
>
> Assalamu Alaykum,
>
> [Name] submitted their 2027 leadership information for [Subregion], listing [Role(s)]. The directory has been updated.
>
> If any of this information is incorrect, please contact [IT contact or approved reporting link] so it can be corrected.

Do not email birthday, ethnicity, full annual answers, private notes or account details. Any link to detailed data must require authorization. Group emails are **recipients**, not logins or approval authorities.

## 5. Permissions

| Capability | Authorized platform member | IT admin | Not signed in |
|---|---|---|---|
| View/search entire Sisters leadership directory | Yes | Yes | No |
| View directory-safe contact/profile information | Yes | Yes | No |
| Submit own form with valid invitation/auth | When eligible | When eligible | Only through a validated invitation flow |
| See all submitted answers, including sensitive fields | No | Yes, as needed | No |
| Edit/correct canonical records, resend failed notifications, manage invites | No | Yes | No |
| Manage platform permissions | No | Yes | No |

Use database RLS and server-side authorization for all restricted reads/writes. A user interface hiding a button is not a security boundary. Separate directory-safe fields from sensitive intake answers. Ensure CSV exports include only directory fields the current user may view.

**Authentication (confirmed 2026-11-16):**
- **Form:** public via link, any email address. Submissions are written server-side. Anonymous users can never read anything back.
- **Directory and IT dashboard (2026-11-23):** Google sign-in through Supabase Auth. `private.current_platform_role()` decides access from the verified Google Workspace identity (never from the account email alone), and every RLS policy uses it. Pages repeat the check; `proxy.ts` only redirects. A YM mailbox must never be required to *submit* the form.

## 6. Reliability and operations

- Versioned SQL migrations, foreign keys, unique constraints, indexes for directory search/filtering, and structured status fields.
- Authenticated user and IT-admin policies with allow/deny tests.
- Server-side form validation, rate limits, expiring invitation tokens, hashed tokens at rest, and safe error handling.
- Audit trail for administrative corrections and identity merges.
- Separate local/test/production environments. Backups, recovery and ownership belong to YM-controlled accounts.
- Keep service credentials server-only; use least-privilege provider keys.
- Track accepted submissions and notification attempts independently for troubleshooting. In the IT dashboard use the same search and dark-green Filter/Sort controls as the directory; keep email status inline in the responses table, not in a separate notification module.

## 7. Configuration to confirm before production

These are **integration details, not reasons to stop implementing local functionality**:

- Supabase project ownership, environment credentials, hosting and domain.
- Google OAuth client and the final list of IT admin emails.
- Source of truth for official SR/NN mappings, SRC group email recipients, and an IT correction contact/link.
- Transactional email provider (likely Gmail / Google Workspace), verified sender/domain, retries and operational monitoring.
- The latest Brothers schema and shared naming standards.
- Whether the 2027 form permits replacing a prior submission or creates a versioned correction; preserve audit/history either way.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Expo monorepos (future)](https://docs.expo.dev/guides/monorepos/)
