# COG frontend overlay

## Install
1. Back up or commit your existing project.
2. Copy the contents of this archive directly into the repository root, merging folders; overwrite `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/globals.css`.
3. Keep all your existing API routes, Prisma schema, authentication and environment variables untouched.
4. Run `npm install` (or `npm install --ignore-scripts` if your existing Prisma postinstall is still broken), then `npm run dev`.
5. Visit `http://localhost:3000`.

## Implemented
- Responsive homepage with hero, milestones, about, programmes, legacy, impact and CTA.
- About, programmes, legacy, updates, assistance, donation, member and contact routes.
- Shared header/footer and original imagery extracted from COG client brochure.
- Palette: deep green, gold, cream with orange accents, based on the supplied COG collateral/proposal.

## Integration deliberately NOT claimed
- Donation checkout, assistance form submission, authenticated member dashboard, multilingual Gujarati content, CMS, mobile OTP and admin tools are NOT wired by this frontend overlay.
- The uploaded proposal specifies Turso, but the existing code uses Cloudflare D1. Confirm database choice with the client; this overlay does not modify the database.
- Do not publish forms/payments as live before integrating validation, authentication, security, storage and backend workflows.
- Some PDF artwork is illustrative; review image usage and all factual copy with the client before publication.

## Content source
COG 40 Years: A Legacy of Service (1987–2027), COG E-Catalogue and NextJs COG Platform Proposal, supplied by the client.
