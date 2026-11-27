# YM Sisters Leadership Platform

**Status:** Approved for development  
**Initial release:** 2027 leadership onboarding, directory, and IT responses  
**Primary users:** YM Sisters leadership and IT administrators

## Goal

Replace the annual Google Form and spreadsheet with one platform for collecting leadership information, maintaining permanent profiles, finding leaders across YM Sisters, and tracking submissions.

## Release phases (confirmed 2026-11-16)

**Form: public, no login.**
- The 2027 annual form is reached by a shared link. Nobody signs in to fill it out.
- **Any email address is accepted on the form** (personal or YM).
- Submissions are visible only in the **IT dashboard** (`/admin`).
- SRC notification emails still go out on every accepted submission.
- **Returning people (decided 2026-11-23, replaces one-time email codes):** a returning person is recognized by email plus the date of birth on their latest submission. If the date of birth does not match, or none is on file, nothing is saved and they are asked to contact IT; five failed matches for an email block it for an hour. This does not prove that a new submitter owns the email they typed.
- Ambiguous matches (same name, different email) are flagged for IT, never auto-merged.

**Directory and IT login (decided 2026-11-23, moved into the first release).**
- Anyone who signs in with Google on an allowed YM domain (currently `ymsisters.com`, including shared mailboxes) can view the Sisters-wide directory. Phone numbers are visible to them.
- IT dashboard access is limited to listed emails (currently the IT lead only).
- People sign in again every 7 days, so a suspended mailbox loses access.
- Domains and IT emails are rows in `private.allowed_domains` and `private.it_admins`; changing one is a single SQL statement.
- YM email and mailing address (decided 2026-11-27) are visible only to IT and the National Shura. National Shura accounts are rows in `private.national_shura`; they get directory access plus these two fields, never raw submissions or the IT dashboard.
- Invitations come later.

**Email provider:** probably Google Workspace/Gmail for sending SRC notifications. Keep the provider-neutral adapter.

## Initial scope

1. **2027 annual form:** Leaders submit or update their information. Returning leaders use their existing permanent profile. Preserve each year's submitted answers.
2. **Leadership directory:** Every authorized platform member can search and view permitted profile/contact information across **all YM Sisters regions**, not just their own region. Search by name, role, team, location, skills, and interests. Provide filters, sorting, contact links, and a profile side panel.
3. **IT responses:** IT can view all annual submissions, the submitted information and SRC notification delivery status. A submission detail view displays submitted information and relevant administrative details.
4. **SRC notifications:** After **every successfully accepted form submission**, automatically email the corresponding **SRC group address for the submitter's subregion**. The SRC is informed, **not asked to approve**. Include a way to report incorrect information to IT. Track email delivery or failure for IT.
5. **Invitations and access (later):** Secure invitation links, recipient tracking, and authorized platform login. IT controls account access. Form completion and platform access are separate states.

## Confirmed product rules

- **One permanent person, one UUID.** A returning person's new submission updates the existing profile rather than creating another person.
- A person may have multiple simultaneous or historical YM leadership roles.
- Store each annual submission independently. **Cloud interest/opt-in is renewed annually**; do not carry it forward automatically.
- An accepted form submission and directory update happen **atomically, without SRC approval**. Treat submitted roles as user-reported until corrected through an authorized process; IT can correct errors and preserve an audit trail.
- Any authorized platform member can access the YM Sisters-wide directory. **IT-only** functions and sensitive form fields remain restricted.
- SRC notifications are sent on **all submissions** from their subregion, not only submissions claiming certain roles.
- Directory-only profile views must exclude sensitive fields such as birthday, ethnicity, private form responses, and administrative-only account data.
- Sisters and Brothers remain **separate applications/databases for now**. Keep future interoperability practical, but do not build shared onboarding or a cross-app API in the initial release.

## Annual form information

The approved Figma form is the source of truth for wording, ordering, conditional fields, and layout. The information includes:

- Identity/contact: first name, last name, email, phone, birthday.
- Organizational location: state, region/subregion (SR), NeighborNet (NN).
- 2027 involvement: Active Leadership or Interested in Cloud, plus current position(s), team(s), and applicable term dates.
- YM background: prior leadership positions and years; skills and YM interests.
- Background: field(s) of study, organizations, other information, and multi-select ethnicity where shown in the approved form.

Do **not** expose every collected field in the public-to-platform directory. Treat ethnicity, birthday, and full submissions as restricted information.

## Figma reference

**File:** [Leadership Platform YM](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM)  
**Page:** `2027 Contact Form & Directory` (node `2060:2`; final form screens are the "Final Option A" / numbered frames to the right of the early wireframes)

| Screen | Node |
|---|---|
| Main directory | [`2148:97`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-97) |
| Directory profile slide-out | [`2148:271`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-271) |
| Full filter menu | [`2148:502`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-502) |
| Applied filters/results | [`2148:712`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-712) |
| Sort menu | [`2148:838`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-838) |
| Export modal | [`2148:1206`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-1206) |
| Search results | [`2148:1395`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-1395) |
| Skills dropdown | [`2148:1506`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2148-1506) |
| IT dashboard | [`2189:2`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2189-2) |
| Form 1: Personal information | [`2087:115`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2087-115) |
| Form 2: Contact details | [`2108:45`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2108-45) |
| Form 3: YM involvement (Active / Cloud) | [`2108:176`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2108-176) |
| Form 3a: Current positions (Active path) | [`2112:49`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2112-49) |
| Form 3b: Previous positions (both paths) | [`2112:130`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2112-130) |
| Form 4: Skills & interests | [`2112:215`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2112-215) |
| Form 5: Education & career | [`2116:136`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2116-136) |
| Form 5b: Organizations & anything else | [`2116:246`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2116-246) |
| Review & submit | [`2116:338`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2116-338) |
| Completion | [`2116:442`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2116-442) |
| Dev notes (flow, roles, multiselects, submission, interactions) | [`2115:45`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2115-45), [`2115:50`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2115-50), [`2115:55`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2115-55), [`2117:45`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2117-45), [`2118:47`](https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM?node-id=2118-47) |

The Figma prototype shows fictional example data and navigation, **not a functioning backend**. Implement the interactions using real data. Keep its restrained YM green/cream branding, Boldonse headings, Figtree body text, readable sage-green borders, separate role pills, contact icons, and scrollable profiles. The IT dashboard uses the same dark-green Filter/Sort toolbar and searchable responses table, displays SRC email delivery per row, and has no routine directory-updated column or separate SRC notification card. Do not introduce unnecessary dashboard charts or additional navigation tabs.

## Not in first release

Native mobile app, Brothers/Sisters database merging, joint-team onboarding, voting/YMLC workflows, event management, advanced recruitment systems, automatic YM email provisioning, or SRC approval dashboards.

## Other repository docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md): Stack, data model, auth, permissions, submission/event flow, and decisions still requiring configuration.
- [`FIGMA_ASSETS.md`](FIGMA_ASSETS.md): Design source, assets and design consistency checks.
- [`../AGENTS.md`](../AGENTS.md): Coding agent instructions, implementation order, and acceptance checklist.
