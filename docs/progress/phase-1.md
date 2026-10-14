# Phase 1 progress

Status of the work in `docs/phase-1-remaining-prompt.md`. WP1 and WP4 were done by the first implementer; WP2, WP3 and the review fixes were done afterwards.

## 1. Work packages

| WP | Status | Notes |
|---|---|---|
| WP1 Three staff roles | done | commit b86e568 |
| WP2 English + Gujarati | done | uncommitted |
| WP3 Public pages and content | done (with marked placeholders for missing COG content) | uncommitted |
| WP4 Team, members, activity log | code done, **not run against a database** | commit bf1184b, reviewed; one fix below |

## 2. Review of WP1 / WP4 and fixes made

- WP4 follows the agreed design: invite hook on `user.update.before` / `create.before`, acceptance and audit row in the `after` hooks, idempotent `markInviteAccepted`, last-Super-Admin guard, phone masking and no phone search for viewers.
- **Fixed:** denied page access (for example a viewer opening `/team`) redirected without an audit row. `requirePermission` in `src/lib/auth.utils.ts` now writes `access.denied` with `entityType: "page"`.

## 3. What WP2 / WP3 added

- `next-intl` 4.14, every route under `src/app/[locale]/`, `src/proxy.ts` for detection, locale cookie kept for a year.
- `messages/en.json` and `messages/gu.json` (646 keys each, typed). All component text, nav, Zod errors (via `FormFieldError`), auth errors and tRPC errors are translated. tRPC gets the page language from an `x-cog-locale` header.
- Language switcher in the public header (cookie) and the dashboard header (cookie plus `user.preferredLanguage` through `profile.setLanguage`). Saving a different preferred language on the profile page also switches the dashboard.
- Brand fonts: Cormorant Garamond, Inter, Noto Sans / Serif Gujarati via `next/font`.
- New pages: Our Journey, Leadership, Our Work index plus five programme pages, Impact, Next Generation, Privacy, Terms, localized 404. About, Home and Contact refreshed. `/programmes` and `/legacy` redirect permanently.
- Impact figures, contact details and the programme list live in `src/content/`.

## 4. Open items for COG

1. Names and years of the 10 presidential terms (brochure p.6 is an image).
2. The full Our Journey timeline (brochure p.5 is an image) and the year of the Talaja housing project.
3. Brochure p.9 (Housing): the four highlight texts are copied from the Education page. The site uses housing facts from elsewhere in the brochure instead; COG should supply the real text.
4. Brochure p.15 says "five priorities" but lists six; the site lists six.
5. Social media links (footer shows placeholders).
6. Privacy policy and terms text.
7. Review of the Gujarati draft.
8. Confirm the impact figures are cleared for public display.

## 5. Known gaps and shortcuts

- WP4 flows are still untested at runtime (you chose not to test against the remote D1 database).
- Dev-only "instant validation" notices appear in the dev server log when a logged-out visitor opens a dashboard URL; this is the expected redirect, not a bug.
- The programme detail page sets `instant = false` so unknown slugs return a real 404 (`dynamicParams` is not allowed with Cache Components).
- Numbers inside Gujarati pages that come from `src/content/` (impact figures) use Latin digits; text inside messages uses Gujarati digits.

## 6. Schema migrations

None.

## 7. Final checks

`npm run typecheck` clean, `npm run lint` clean, `npm run build` succeeded (88 static pages). In the dev server: every page returns 200 in both locales, unknown paths 404, `/` follows the locale cookie, the switcher keeps the current page, `/gu/dashboard` logged out redirects to `/gu/member`, Zod errors show in Gujarati, no horizontal scroll at 375px.
