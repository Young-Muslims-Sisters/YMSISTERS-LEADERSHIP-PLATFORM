# Coding Agent Handoff

Read `docs/README.md` and `docs/ARCHITECTURE.md` before writing application code. The form is public; the directory and IT dashboard need a YM Google sign-in (see "Release phases" in `docs/README.md`). The linked **2027 Contact Form & Directory** Figma page is the approved visual and field-flow reference. This is a **web-first** build. Prioritize working data flows and security, then polish the UI to match Figma.

## Non-negotiable requirements

- Keep the codebase **simple, clean and compatible in concepts/naming with the Brothers system**. Use TypeScript and PostgreSQL; no speculative tables or services.
- Build only the approved initial scope: annual form, directory/profile, IT responses dashboard, invitations/access, automatic SRC notifications.
- **Every valid accepted submission updates the directory and queues an informational email to the corresponding subregion's SRC group email.** SRCs do **not** approve submissions. IT can see submissions and notification status and correct errors.
- All authorized platform users can access the **full Sisters-wide directory**; sensitive intake answers are **IT-only**.
- Person identity uses an immutable UUID, never an email or auth ID as the profile primary key. Returning people reuse an existing record.
- Preserve 2027 submissions and prior-role history. Cloud is annual opt-in.
- Use the approved Figma styling and flow. No extra dashboard modules or invented user-visible features.

## Build order

1. **Initialize:** Next.js App Router, TypeScript strict, Tailwind, accessible components, lint/typecheck/test scripts, `.env.example`, database migrations. Use current compatible stable dependencies.
2. **Database and security:** Schema, seed/reference geography/roles, permission rules, RLS allow/deny tests, and shared validation schemas. Add mock/test SRC email routes, never guess real addresses.
3. **Identity and invitations:** Auth integration, verified invitation tokens, returning-user matching, scoped admin access. Expose a clean development/test login workflow using fake people only.
4. **Annual form:** Implement the approved 2027 screens and conditional answers, validation, returning-person prefill and submission receipt. Keep sensitive fields protected.
5. **Intake pipeline:** Transactionally persist submission and update directory. Queue one notification per submission/recipient with idempotent delivery and retry. Show failed/no-route states to IT. Accepted submissions must never remain in a partially updated directory state.
6. **Directory:** Search, filters (including searchable multi-select skills), role pills, sorting, removable filter chips, permitted CSV export, click-to-email/phone, and a vertically scrollable profile slide-out.
7. **IT dashboard:** Overview and 2027 Responses list, open details, filter responses, view SRC email sent/failed/no-route status, and correct information through an authorized, audited workflow. No redundant “Directory Updated” column.
8. **Verification:** Automated tests, responsive layouts, accessibility checks, seed data for demonstration, README setup instructions, and handoff notes.

## UI references

Main form and all updated directory screens are on the **same Figma page**.

- [Annual Form and Directory Figma file](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM)
- [Directory](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-97)
- [Profile panel](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-271)
- [Full filter menu](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-502)
- [Filtered state](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-712)
- [IT responses dashboard](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2189-2)

If Figma cannot be accessed programmatically, do **not** invent missing visual details. Use supplied screenshots or ask for the relevant exports. The seed data must be fictional placeholders.

## Acceptance checklist

- [ ] New invitee creates a permanent UUID-backed profile and completes the 2027 form.
- [ ] Returning invitee submits again without creating a duplicate profile.
- [ ] A multi-role user appears with each role separately; current/historical roles remain traceable.
- [ ] A successful submission persists and immediately updates the directory before/independently of email sending.
- [ ] Every submission routes one email to the correct SRC group; retries do not duplicate sent messages.
- [ ] SRC email says how to report incorrect information to IT, and **never** asks for approval.
- [ ] IT Responses lists accepted form submissions and SRC notification sent/failed/no-route state. Directory updates are atomic, so do not show a routine “Updated” column.
- [ ] Authorized users from any SR can search the **whole** directory and open profiles.
- [ ] Sensitive fields and raw form submissions are inaccessible to ordinary platform members and CSV exports.
- [ ] Cloud interest is attached to the **specific year**, not copied automatically from earlier years.
- [ ] Search, filters, sorting, skill multiselect, email/phone actions and the profile drawer work with real seeded data.
- [ ] Direct URL access, API calls, and database RLS deny unauthorized admin/sensitive operations.
- [ ] Tests, lint, typecheck, migration reset and production build pass.
- [ ] README documents local setup, environments, migrations, seeds, notification testing, and deployment requirements.

## Decision handling

Confirmed decisions are recorded in the other two documents. For **unsettled infrastructure details** (login email policy, exact email provider, recipient mapping, hosting, latest Brothers schema), use explicit configuration interfaces and safe development defaults, document assumptions, and require confirmation **before production deployment**. Do not invent SRC group addresses, claim an integration works without credentials, or silently change the product workflow.

## Suggested first agent instruction

> You are implementing the YM Sisters Leadership Platform. Read docs/README.md, docs/ARCHITECTURE.md, and AGENTS.md first. Use the linked 2027 Contact Form & Directory Figma page as the approved design reference. Implement a working web-first Next.js/TypeScript/Supabase MVP, including annual onboarding, permanent profiles, the Sisters-wide directory, an IT responses dashboard, and informational SRC group notifications on every form submission. Keep the schema Brothers-compatible, minimal and clean. Implement secure permissions and tests, and do not assume missing production secrets or recipient addresses. Build in logical commits, verify each milestone, and report what works and what remains configurable.
