# COG Website

Bilingual (English / Gujarati) member, donation and assistance platform for COG.
Core principle: one person, one account, one record, many COG services. Every member, donor and applicant is a single user record identified by a verified mobile number.

@AGENTS.md

## Brief before code

Before writing or changing any code, post a short brief and wait for the go-ahead:

- what will change and why, in two or three sentences
- the files that will be created or edited
- any schema, env or dependency change it needs

Skip the brief only for trivial fixes (typos, a one-line bug) the user has already described exactly.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript. Read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from older versions.
- Tailwind CSS 4
- Prisma 7 with the SQLite provider, talking to Turso (libSQL) through `@prisma/adapter-libsql`
- Better Auth: phone-number OTP plugin, admin plugin for roles, Google linking only
- Upstash Redis: Better Auth rate limits and the OTP guards
- tRPC 11 + TanStack Query + superjson
- Zod for all validation, including env
- next-intl for `/en/...` and `/gu/...` routes
- Razorpay for payments, MSG91 for OTP SMS, Cloudflare Turnstile for bot checks (planned)
- Cloudflare R2 for private uploaded documents, signed with `aws4fetch`
- Hosting: Vercel, DNS through Cloudflare

## Folder structure

```
src/app/[locale]/   every page and layout, under /en or /gu (route handlers stay in src/app/api)
src/i18n/           next-intl routing, locale-aware Link/redirect/useRouter, request config
src/proxy.ts        locale detection and the NEXT_LOCALE cookie (Next 16 renamed middleware to proxy)
messages/           en.json and gu.json, same keys; typed through src/i18n/global.d.ts
src/content/        site facts kept in one place: contact details, impact figures, programme list
src/lib/            server and shared modules
  auth.ts           Better Auth server config
  auth.client.ts    Better Auth browser client
  auth.utils.ts     getSession / requireAuth helpers for server components
  db.ts             Prisma client on Turso
  env.ts            Zod-validated env in lazy groups (dbEnv, authEnv, redisEnv, smsEnv, aadhaarEnv, storageEnv, razorpayEnv, seedEnv); never read process.env elsewhere
  auth.schemas.ts   Zod schemas shared by the auth config and the sign-in form
  aadhaar.ts        Aadhaar format, checksum and last-4 helpers (client-safe)
  aadhaar.server.ts store, read and purge the encrypted Aadhaar
  crypto.ts         AES-256-GCM helpers
  permissions.ts    roles and access control, shared by server and client
  phone.ts          +91 validation and placeholder email helper
  rate-limit.ts     Upstash storage for Better Auth, the OTP guards and the donation limits
  razorpay.ts       Razorpay orders, payments, capture and signature checks (plain fetch, no SDK)
  donations.server.ts settlePayment marks a donation paid or failed from a Razorpay payment and issues the receipt number
  redis.ts          Upstash client
  members.server.ts approveMember issues the COG Member ID from a counter that only goes up
  sms.ts            OTP, application-status and approval SMS (MSG91 when the keys are set, otherwise the server log)
  storage.ts        R2 signed upload and download links, HEAD and DELETE for documents
  forms/            assistance forms: the JSON definition format, answer validation, application statuses, document limits, staff review access (review.server.ts)
src/components/     site shell, shadcn components in ui/, feature components (member/, team/, members/, audit/, profile/, applications/, review/, forms-admin/, donate/, donations/)
src/trpc/           tRPC init, routers, server and client wiring
src/generated/      Prisma client output, never edit
prisma/schema.prisma
prisma/seed.ts      Super Admin seed
prisma/seed-forms.ts the six assistance forms with starter questions
migrations/         SQL migrations applied by scripts/db.ts
```

## Rules

- Money is stored and passed as integers in paise. Convert to rupees only when rendering.
- Aadhaar: the full number is collected at sign-up and held only as AES-256-GCM ciphertext in `MemberProfile.aadhaarEncrypted` (key `AADHAAR_ENCRYPTION_KEY`) until the account is approved or rejected. Approval and rejection must call `purgeFullAadhaar()`, which leaves only `aadhaarLast4` and the DigiLocker timestamp. Never log it, return it to the client, or put it in URLs, audit logs or error messages. Reading it goes through `readFullAadhaar()` behind a permission check and an `AuditLog` row. Entering the number is not verification; only DigiLocker sets `aadhaarVerifiedAt`.
- All input goes through Zod: tRPC inputs, route handlers, server actions, forms, and env variables. Never trust a client value.
- Forms use react-hook-form with `zodResolver` and the shadcn `FieldGroup` / `Field` / `Controller` pattern (`data-invalid` on `Field`, `aria-invalid` on the control). Read `.claude/skills/shadcn` before adding or changing UI.
- Phone numbers are `+91` followed by a 10-digit mobile starting 6 to 9. Validate with `INDIAN_MOBILE` from `src/lib/phone.ts`.
- There are no passwords. OTP is the only login. Google can only be linked from inside a logged-in account and must never create a user.
- Accounts start as `pending`. Statuses are `pending`, `under_review`, `documents_required`, `approved` and `rejected`. Every account except a rejected one gets a session, but until it is `approved` it only sees the review screen on `/dashboard`: pages go through `requireApproved` (or `requirePermission` / `requireNavAccess`) and tRPC through `protectedProcedure`, which all require `approved`. Approval is done by an admin from the members sheet and goes through `approveMember()`, which issues the COG Member ID (`COG-000001`) once; it is never changed or reused, even if the status changes later. The member is told by SMS.
- Roles: `member`, `super_admin`, `admin`, `editor`, `viewer`. Check permissions through `src/lib/permissions.ts`, never by comparing role strings in feature code.
- Every admin action and every denied access attempt writes an `AuditLog` row.
- Uploaded documents are private. Never expose a public URL for them. Staff open them through a permission-checked route that writes an `AuditLog` row and hands out a short-lived R2 link.
- Staff see an assistance form's applications only through `formAccessLevel()` in `src/lib/forms/review.server.ts`. Roles with `form: ["assign"]` (Super Admin) see every form and manage `FormAccess` grants; everyone else needs a grant, and their level (`view`, `review`, `decide`) is capped by their role's `application` permissions. Contact answers are masked for roles without `member: ["readContact"]`, in the review screen and the Excel export.
- Forms are built at `/forms` (`formsAdmin` router): `form: ["read"]` views, `form: ["write"]` edits. The builder has no Save draft button: Publish saves and publishes in one step. Older unpublished `FormVersion` drafts can still be discarded. A question's answer type is locked once any published version contains it, and a form can only be opened after its first publish. New question, section, choice and column IDs come from `newId()` in `src/lib/forms/builder.ts` and must never be reused for something else.
- Assistance forms are data, not code. Each `Form` has numbered `FormVersion` rows whose `definition` is JSON checked by `formDefinitionSchema`; a published version is never edited, so changes create a new version. An `Application` keeps the version it was started on. Validate answers with `buildAnswersSchema(definition, "draft" | "submit")`. Money answers are number fields with `money: true`, stored in paise.
- Donations are one-time only. The donate form calls `donations.start` (creates the Razorpay order and a `created` row) and opens Razorpay Checkout. A donation becomes `paid` only through `settlePayment()`, after Razorpay confirms the payment: either `donations.confirm` (checks the checkout signature, then fetches the payment from Razorpay) or the signed webhook at `/api/razorpay/webhook`. Both are safe to run twice. The `DON-000001` receipt number is issued once, in the same transaction that marks it paid. Never mark a donation paid from a client value. Members see their paid donations at `/my-donations` (matched by user or verified mobile); staff use `/donations` with `donation: ["read"]` and export with `donation: ["export"]`, with contact details masked for roles without `member: ["readContact"]`.
- Use `db.$transaction` when several writes must land together. Otherwise design writes so a partial failure is safe to retry.
- User-facing text lives in `messages/en.json` and `messages/gu.json`, never hardcoded in components. Add every key to both files. `gu.json` is a draft translation pending COG review.
- Use `Link`, `redirect`, `useRouter` and `usePathname` from `@/i18n/navigation`, not `next/link` or `next/navigation`, so the locale is kept.
- Zod error messages are keys from `messages.Validation`; render them with `FormFieldError`. tRPC errors use `errorsFor(ctx.locale)`.
- The screen never looks idle while work is still going on. After a submit or any awaited call that ends in a navigation or refresh, keep the loader on until the next screen has rendered: run `router.push` / `router.refresh` / `router.replace` inside `startTransition` from `useTransition` and fold its pending flag into the button's loading state, and keep confirm dialogs open (`event.preventDefault()` on the action) until then. Sign-in and sign-out use a full page load (`window.location.assign`) so no cached signed-in or signed-out pages survive.
- Date inputs use `DatePicker` from `src/components/ui/date-picker.tsx`, never `<input type="date">`. Values stay `YYYY-MM-DD` strings.
- Secrets live only in `.env` and Vercel env. Do not commit them or print them.

## Database workflow

Migrations are plain SQL files applied by `scripts/db.ts`, not `prisma migrate`. For every schema change:

1. Edit `prisma/schema.prisma`.
2. `npm run db:migration:new -- <name>` creates an empty file in `migrations/`.
3. `npm run db:migration:diff` applies the existing migrations to `.local/schema-check.db` and prints the SQL still missing; paste it into that file. Run it again and it should print nothing.
4. `npm run db:migrate` applies pending migrations to `TURSO_DATABASE_URL`.
5. `npm run db:generate` to refresh the client.

After adding a Better Auth plugin or user field, regenerate its tables with `npx auth@latest generate` and review the diff before migrating.

Seed the Super Admin with `SUPER_ADMIN_PHONE` and `SUPER_ADMIN_NAME` set in `.env`, then `npm run db:seed`. Seed the assistance forms with `npm run db:seed:forms`; they start closed and a form that already has questions is left alone. Both are safe to re-run.

## Commands

- `npm run dev` start locally
- `npm run typecheck` TypeScript check
- `npm run lint` ESLint
- `npm run build` production build

## Environment variables

Required: `AADHAAR_ENCRYPTION_KEY` (32 random bytes, base64; generate with `openssl rand -base64 32`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (`http://localhost:3000` locally, the deployment's own URL on Vercel; there is no default), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
Documents: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. The bucket stays private and needs a CORS rule allowing `PUT` with a `content-type` header from the site's origins.
OTP delivery: `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`. Until both are set, OTPs are written to the server log in every environment, production included.
Development only: `EXPOSE_OTP_TO_BROWSER=true` also prints each OTP in the browser console. Never set it once real members use the site.
Application SMS: `MSG91_APPLICATION_TEMPLATE_ID`, a MSG91 flow template with `##number##` and `##status##` variables. Until it and `MSG91_AUTH_KEY` are set, status messages go to the server log.
Approval SMS: `MSG91_APPROVAL_TEMPLATE_ID`, a MSG91 flow template with a `##memberid##` variable. Until it and `MSG91_AUTH_KEY` are set, the message goes to the server log.
Donations: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (test keys until go-live), `RAZORPAY_WEBHOOK_SECRET`. Until all three are set the donate form says online donations are unavailable. In the Razorpay dashboard add a webhook to `<site>/api/razorpay/webhook` with that secret and the `payment.authorized`, `payment.captured`, `payment.failed` and `order.paid` events. The webhook cannot reach `localhost`; use a tunnel or a preview deployment to test it.
Seed only: `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_NAME`.

## Known gaps

- tRPC has no per-user / per-IP rate-limit middleware yet. Denied permission checks are audited through `staffProcedure` in `src/trpc/init.ts`; use it (not `protectedProcedure`) for every admin procedure.
- Approving or rejecting from the members sheet calls `purgeFullAadhaar()`, but accounts that are never decided keep their encrypted Aadhaar. Add a retention job as a safety net.
- OTPs go to the server log while MSG91 is not configured; anyone with Vercel log access can sign in as any number until it is.
- Development only, remove before go-live: with `EXPOSE_OTP_TO_BROWSER=true` the send-OTP response carries the code in the `x-dev-otp` header and the sign-in page prints it to the browser console. Anyone can sign in as any number while it is on. Delete the flag, the header in `src/lib/auth.ts` and the `console.info` in `member-auth.tsx`.
- `getSession()` calls `connection()` so Partial Prefetching never starts a session lookup it then abandons; protected pages stream in behind the layout's skeleton instead of being prefetched with session data.
- Consent is stored on `user.consentAcceptedAt` only; the `Consent` table is not written yet.
- Leadership names and years, the full journey timeline, social links, privacy and terms text are placeholders until COG supplies them.
- Turnstile and the daily OTP cap with admin alert are not built yet. Starting a donation is public and only rate limited per IP until Turnstile is added.
- Donation receipts are a number only; there is no printable 80G receipt or receipt email yet, and refunds are done in the Razorpay dashboard.
