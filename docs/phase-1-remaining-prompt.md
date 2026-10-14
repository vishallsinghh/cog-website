# Phase 1 — remaining work (prompt for the implementing chat)

You are working on the COG website in this repository. Read `CLAUDE.md` and `AGENTS.md` first and follow them exactly. In particular:

- **Brief before code.** Before each work package below, post the brief CLAUDE.md asks for (what changes and why, files touched, schema/env/dependency changes) and wait for my go-ahead.
- Next.js 16 differs from what you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. For i18n start with `node_modules/next/dist/docs/01-app/02-guides/internationalization.md`. Note that `middleware.ts` is now `proxy.ts` in this version, so check the docs.
- Read `.claude/skills/shadcn` before touching UI. Forms use react-hook-form + `zodResolver` + the `FieldGroup` / `Field` / `Controller` pattern.
- Check access only through `src/lib/permissions.ts` / `src/lib/access.ts` (`hasPermission`). Never compare role strings in feature code.
- D1 has no transactions. Design every multi-step write so it is safe to retry.
- Use the D1 workflow in CLAUDE.md for any schema change. Never run `prisma migrate dev`.
- Run `npm run typecheck`, `npm run lint` and `npm run build` at the end of every work package. Fix anything they report before you say the package is done.
- Make one commit per work package on the current branch. Do not push.

## Out of scope — do not touch

- Security work: Turnstile, the daily OTP cap and alert, tRPC rate-limit middleware, "log out of all devices".
- Go-live: domain, Cloudflare, DLT, MSG91 keys.
- Aadhaar handling: leave the sign-up Aadhaar field and `aadhaar*.ts` exactly as they are.
- The approval gate: pending users still cannot log in. Do not change the `session.create.before` hook in `src/lib/auth.ts`. Do not build approve/reject.
- The database layer (`src/lib/db.ts`, the D1 adapter).
- Payments, Jamaats, applications, blogs (Phases 2 and 3). Their placeholder pages stay.

## Current state, so you don't re-discover it

- Public pages live in `src/app/(public)/`: home (`src/components/home-sections.tsx`), about, legacy, programmes, assistance, donate, contact, updates. Every string is hardcoded English. The header and footer are in `src/components/site-shell.tsx`.
- `src/app/globals.css` holds the COG palette, but the fonts are Arial/Georgia. The brand fonts are Cormorant Garamond (headings) and Inter (body).
- Auth is Better Auth with phone OTP. The sign-in/sign-up UI is in `src/components/member/`, with messages in `auth-messages.ts`.
- The dashboard is under `src/app/(protected)/`. The sidebar comes from `src/lib/navigation.ts`. `team`, `members` and `audit-log` are `PagePlaceholder` pages.
- The Prisma schema already has `StaffInvite` and `AuditLog` models, but nothing reads or writes them yet. `user.preferredLanguage` exists and defaults to `"en"`.
- `src/lib/permissions.ts` defines 8 roles. We are reducing that (WP1).
- Source content as plain text: `docs/source/cog-40-years-text.txt` (the 40 Years brochure, 18 pages) and `docs/source/e-catalogue-text.txt`. The originals are in `C:\Users\welcome\Downloads\` (`COG_40_Years_A_Legacy_of_Service_1987-2027 (1).pdf`, `The_Council_of_Gujarat_Catalogue_E_Catalouge (1).pdf`). Brochure pages 5 (Our Journey timeline) and 6 (the 10 presidential terms) are images with no extractable text.

---

## WP1 — Reduce to three staff roles

The client wants only **Admin, Editor, Viewer**, plus the existing **Super Admin** and **Member**.

- Rewrite `src/lib/permissions.ts` to five roles: `member`, `super_admin`, `admin`, `editor`, `viewer`. Keep the existing permission statements (`member`, `donation`, `application`, `content`, `report`, `auditLog`) so later phases can use them.
  - `super_admin`: everything, including the admin plugin's user-management statements. Only this role can invite, change roles and remove staff.
  - `admin`: read and act on everything operational (members, donations, applications, content, reports, audit log). No staff management.
  - `editor`: `content` read/write/publish, plus `member: ["read"]`.
  - `viewer`: read-only on member, donation, application, content, report and auditLog. No write actions anywhere.
- Update `ROLE_LABELS`, `STAFF_ROLES`, the `admin()` plugin `adminRoles` in `src/lib/auth.ts`, the seed, and any other reference. Grep for the removed names (`programme_manager`, `finance`, `jamaat_verifier`, `content_editor`, `auditor`).
- Update the role list in `CLAUDE.md` to match.
- Check that existing DB rows still hold valid roles. If any could hold a removed role, say how they are handled.

**Done when:** typecheck passes, there are no references to removed roles, and the sidebar shows the right items for each of the 5 roles.

## WP2 — English + Gujarati (next-intl)

- Install `next-intl` and set it up for `/en/...` and `/gu/...`, following the Next 16 docs and next-intl's App Router guide for the installed version.
  - Default locale `en`.
  - Move the `(public)`, `(auth)` and `(protected)` route groups under `src/app/[locale]/`.
  - `src/app/api/*` stays outside the locale segment.
- Locale detection and switching go in `proxy.ts`, with no conflict with the existing auth guards.
- A **language switcher** in the public header and in the dashboard header.
  - The choice is remembered in the next-intl locale cookie.
  - For logged-in users, also save it to `user.preferredLanguage` through a small tRPC mutation, validated with Zod (`"en" | "gu"`).
- Messages go in `messages/en.json` and `messages/gu.json`, namespaced by page or feature. Move **every** user-facing string out of components:
  - public pages, header and footer
  - member auth UI (`auth-messages.ts`)
  - dashboard shell, navigation titles and descriptions, profile form, Zod error messages shown to users
- Gujarati: follow CLAUDE.md. `gu.json` has the same keys. Write a reasonable Gujarati draft where you can, and mark every value as needing COG review (for example a top-level `"_status": "draft — pending COG translation"` note, or another convention you document).
- Set `<html lang>` from the locale. Make sure `Link` and redirects everywhere keep the locale. This includes `requireAuth` redirects, the Google link callback URL in `connected-accounts.tsx`, and post-login navigation.
- Load Cormorant Garamond (headings) and Inter (body) with `next/font/google` and wire them into `--font-heading` / `--font-sans`. Gujarati text needs a font that covers Gujarati script. Add `Noto Sans Gujarati` or similar and make it the fallback for `gu`.

**Done when:**

- `/en` and `/gu` both render every existing page.
- The switcher keeps you on the same page and is remembered on the next visit.
- Login, the Google link flow and logout still work.
- A grep finds no hardcoded English left in `src/app` or `src/components` except `ui/`.

## WP3 — Public pages and content

Build these pages under `[locale]/(public)/`, with all copy from the source text and stored in the message files:

| Page | Source |
|---|---|
| Home (refresh) | brochure p.1–3, e-catalogue p.1–3 |
| About | brochure p.2–4, e-catalogue p.2 |
| Our Journey | brochure p.4–5. The timeline on p.5 is an image, so build the layout with the 1979 / 1987 / 2001 milestones the text does mention, and clearly marked placeholders for the rest |
| Leadership | brochure p.6–7. Gulubhai Bhurani (Lifetime Chairman, p.7) is real content. The **10 presidential terms** are not in the text, so build a 10-card layout with placeholder names and years, and list this as an open item for COG |
| Our Work | the existing `programmes` page becomes an index linking to one page per programme: Education (p.8), Housing (p.9), Healthcare & Welfare (p.10), Group Marriages (p.11), Relief & Resilience (p.12) |
| Impact | p.13–14: 44 Jamaats, 35,000+ people, 100+ villages and cities, 681 families housed, 700 elderly women, 43 programmes, 830 marriages, 1,660 families. Keep the figures in one data file so they can be changed in one place |
| Next Generation | p.15–16 |
| Contact | p.18: Council House, Gopnath Road, Talaja 364140; +91 96627 86186; email `admin@councilofgujarat.org`, website `www.councilofgujarat.org`. The PDFs swap the email and website labels, so use the correct pairing shown here |
| Privacy Policy, Terms | a placeholder structure with headings and an "awaiting COG legal text" note |

- Header nav and footer:
  - Update the header nav for the new pages. Keep it usable on mobile.
  - The footer has address, phone, email, social links (placeholder `#` links, listed as an open item), Privacy and Terms.
- Keep the look consistent with the existing pages and `globals.css` classes. Mobile-first, checked at 375px wide.
- Remove or redirect pages that no longer fit the nav. `legacy` probably folds into Our Journey; propose this in your brief.
- Do not invent facts, names, dates or numbers that are not in the source. Use clearly marked placeholders instead.

**Done when:** every page in the table exists in both locales, the nav and footer link to all of them, nothing breaks or scrolls sideways at 375px, and an open-items list of missing content is written (see Final report).

## WP4 — Admin panel: team, members, activity log

**Audit helper first.** Add `src/lib/audit.ts` with a `writeAuditLog({ actorId, action, entityType, entityId, metadata, ipAddress })` helper. Never put Aadhaar, OTPs or tokens in metadata. Add a tRPC `staffProcedure` (or a permission-aware procedure builder) in `src/trpc/init.ts` that:

- requires a session
- checks a given permission through `hasPermission`
- writes an `AuditLog` row with `action: "access.denied"` when the check fails, and then throws `FORBIDDEN`

**Team (Super Admin only)** — `/team`

- Invite by mobile number (validate with `INDIAN_MOBILE`) and role (`admin` / `editor` / `viewer`). This creates a `StaffInvite` with a 7-day expiry. Show the invite as an expiring link, or just tell the Super Admin to ask the person to log in with that number. No SMS for invites in Phase 1.
- When an invited number completes OTP:
  - **Existing user:** gets the role, and `status` becomes `approved` if it was pending.
  - **New user:** goes through the normal sign-up form, and the `user.create.before` hook in `src/lib/auth.ts` sets the role and `status: "approved"` from the open invite.
  - Either way, the invite is marked `acceptedAt` and an audit row is written.
  - The hook must stay safe if it runs twice.
- List current staff and pending invites. Super Admin can change a role, remove staff (back to `member`, not delete the user) and revoke an invite. Every action writes an audit row.
- The last `super_admin` cannot be demoted or removed. Super Admin cannot be assigned through invites.

**Members** — `/members` (needs `member: ["read"]`)

- A paginated table of users with search (name, phone, Member ID) and filters (status, role, joined date range).
- Use server-side pagination through tRPC, validated with Zod.
- Mask phone numbers for `viewer` (for example `+91 98•••••210`).
- No approve or reject buttons. That is Phase 2.

**Activity log** — `/audit-log` (needs `auditLog: ["read"]`)

- A paginated, newest-first table: time, actor, action, entity, IP.
- Filters by action, by actor and by date range.

**Done when:**

- As Super Admin you can invite a number, log in as that number (dev OTP prints to the console), land in the dashboard with the right role, then have the role changed or removed.
- Every one of those steps appears in `/audit-log`.
- A `viewer` calling a write procedure gets `FORBIDDEN`, and that denial is logged.

---

## Final report (required)

When all four packages are done, write `docs/progress/phase-1.md` with:

1. Each WP: done / partial / skipped, plus its commit hash.
2. Every place you deviated from this prompt, and why.
3. Open items that need COG, such as missing content (leadership names, journey timeline, social links, legal text, Gujarati review).
4. Known bugs or shortcuts you took.
5. Schema migrations added and whether they were applied locally and remotely.
6. The output summary of the final `typecheck`, `lint` and `build` runs.

Be honest in the report. A partial package reported as partial is fine. A partial package reported as done is not.
