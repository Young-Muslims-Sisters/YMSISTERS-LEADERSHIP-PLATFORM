# Figma and Asset Handoff

## Design source of truth
Figma file: https://www.figma.com/design/ddEtZUtgOW6N4XQED8q3Tt/Leadership-Platform-YM

Work from the `2027 Contact Form & Directory` (node `2060:2`; final form screens are the "Final Option A" / numbered frames to the right of the early wireframes) page, which contains the annual form, directory, profile panel, filters, search, export and IT dashboard. Build working UI, not screenshots of the designs.

## What can be pulled from Figma
With file access and a supported Figma integration, the coding agent can inspect frames, sizes, spacing, colors, text, components and exportable image/vector layers. Figma access does **not** automatically provide licensed fonts or production image URLs. If direct access is unavailable, provide PNG screenshots of all form states and export only the assets actually needed.

## Assets to provide or confirm
- Official Young Muslims logo as SVG, plus PNG if available. Do not recreate the logo with plain text.
- Approved Figtree and Boldonse typography names and allowed font delivery method. Obtain webfont files or use properly licensed/hosted alternatives through your organization. Do not take font files from Figma or share them in chat.
- Brand color tokens and applicable branding guidelines. The separate `YM Design Branding` file must be shared with the coding agent if it is to be used.
- Any illustrations, icons or background art not already reproducible with code/CSS. Export SVG for simple icons and PNG/WebP for raster art.
- Authenticated/authorized access to the Figma file for the coding agent, or screenshots/exports as fallback.

## Design consistency checks
- Use one shared app shell: YM logo, sidebar, typography, spacing and green borders.
- Use reusable components for form fields, buttons, table, role pills, status pills, profile cards and filter controls.
- Preserve all 2027 form questions, conditional states, optional/required fields, validation, and completion screens.
- Implement real interactions for invitations, directory search/sorting/filters, profile drawer scrolling, CSV export and IT submissions.
- Check desktop and mobile web layouts, keyboard accessibility, focus states and loading/empty/error states.
- Use fictional seed data until IT approves real access and data.

## Important limitations
A Figma prototype does not specify server behavior or real authentication. Follow `docs/ARCHITECTURE.md` and `AGENTS.md` for those requirements. Never insert actual SRC email addresses, credentials or personal data without authorization.
