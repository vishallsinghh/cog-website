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
- Prisma 7 with the SQLite provider, talking to Cloudflare D1 over its HTTP API through `@prisma/adapter-d1` (no Workers binding, because the site runs on Vercel)
- Better Auth: phone-number OTP plugin, admin plugin for roles, Google linking only
- Upstash Redis: Better Auth rate limits and the OTP guards
- tRPC 11 + TanStack Query + superjson
- Zod for all validation, including env
- next-intl for `/en/...` and `/gu/...` routes
- Razorpay for payments, MSG91 for OTP SMS, Cloudflare Turnstile for bot checks (planned)
- Hosting: Vercel, DNS through Cloudflare

## Folder structure

```
src/app/            routes, layouts, route handlers (api/auth, api/trpc)
src/lib/            server and shared modules
  auth.ts           Better Auth server config
  auth.client.ts    Better Auth browser client
  auth.utils.ts     getSession / requireAuth helpers for server components
  db.ts             Prisma client on D1
  env.ts            Zod-validated env in lazy groups (dbEnv, authEnv, redisEnv, smsEnv, seedEnv); never read process.env elsewhere
  auth.schemas.ts   Zod schemas shared by the auth config and the sign-in form
  aadhaar.ts        Aadhaar format, checksum and last-4 helpers (client-safe)
  aadhaar.server.ts store, read and purge the encrypted Aadhaar
  crypto.ts         AES-256-GCM helpers
  permissions.ts    roles and access control, shared by server and client
  phone.ts          +91 validation and placeholder email helper
  rate-limit.ts     Upstash storage for Better Auth and the OTP guards
  redis.ts          Upstash client
  sms.ts            OTP delivery (console in dev, MSG91 in production)
src/components/     site shell, shadcn components in ui/, feature components (member/)
src/trpc/           tRPC init, routers, server and client wiring
src/generated/      Prisma client output, never edit
prisma/schema.prisma
prisma/seed.ts      Super Admin seed
migrations/         D1 SQL migrations applied with wrangler
```

## Rules

- Money is stored and passed as integers in paise. Convert to rupees only when rendering.
- Aadhaar: the full number is collected at sign-up and held only as AES-256-GCM ciphertext in `MemberProfile.aadhaarEncrypted` (key `AADHAAR_ENCRYPTION_KEY`) until the account is approved or rejected. Approval and rejection must call `purgeFullAadhaar()`, which leaves only `aadhaarLast4` and the DigiLocker timestamp. Never log it, return it to the client, or put it in URLs, audit logs or error messages. Reading it goes through `readFullAadhaar()` behind a permission check and an `AuditLog` row. Entering the number is not verification; only DigiLocker sets `aadhaarVerifiedAt`.
- All input goes through Zod: tRPC inputs, route handlers, server actions, forms, and env variables. Never trust a client value.
- Forms use react-hook-form with `zodResolver` and the shadcn `FieldGroup` / `Field` / `Controller` pattern (`data-invalid` on `Field`, `aria-invalid` on the control). Read `.claude/skills/shadcn` before adding or changing UI.
- Phone numbers are `+91` followed by a 10-digit mobile starting 6 to 9. Validate with `INDIAN_MOBILE` from `src/lib/phone.ts`.
- There are no passwords. OTP is the only login. Google can only be linked from inside a logged-in account and must never create a user.
- Accounts start as `pending`. Only `approved` users get a session. Approval is done by an admin and issues the COG Member ID.
- Roles: `member`, `super_admin`, `admin`, `programme_manager`, `finance`, `jamaat_verifier`, `content_editor`, `auditor`. Check permissions through `src/lib/permissions.ts`, never by comparing role strings in feature code.
- Every admin action and every denied access attempt writes an `AuditLog` row.
- Uploaded documents are private. Never expose a public URL for them.
- Prisma on D1 has no transactions. Design writes so a partial failure is safe to retry.
- User-facing text lives in translation files, never hardcoded in components. Gujarati uses placeholders until COG supplies translations.
- Secrets live only in `.env` and Vercel env. Do not commit them or print them.

## Database workflow (D1)

`prisma migrate dev` does not work against D1. For every schema change:

1. Edit `prisma/schema.prisma`.
2. `npm run db:migration:new -- <name>` creates an empty file in `migrations/`.
3. `npm run db:migration:diff` prints the SQL; paste it into that file.
4. `npm run db:migrate:local`, check it, then `npm run db:migrate:remote`.
5. `npm run db:generate` to refresh the client.

After adding a Better Auth plugin or user field, regenerate its tables with `npx auth@latest generate` and review the diff before migrating.

Seed the Super Admin with `SUPER_ADMIN_PHONE` and `SUPER_ADMIN_NAME` set in `.env`, then `npm run db:seed`. It is safe to re-run.

## Commands

- `npm run dev` start locally
- `npm run typecheck` TypeScript check
- `npm run lint` ESLint
- `npm run build` production build

## Environment variables

Required: `AADHAAR_ENCRYPTION_KEY` (32 random bytes, base64; generate with `openssl rand -base64 32`), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN`.
Production OTP delivery: `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`.
Seed only: `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_NAME`.

## Known gaps

- tRPC has no per-user / per-IP rate-limit middleware or audit-log helper yet, so denied admin calls are not logged.
- No approve or reject flow exists yet, so nothing calls `purgeFullAadhaar()`; encrypted Aadhaar numbers stay until Part 9 adds it. Add a retention job as a safety net.
- Consent is stored on `user.consentAcceptedAt` only; the `Consent` table is not written yet.
- Page copy is English only until next-intl is set up.
- Turnstile, the daily OTP cap with admin alert, and Member ID issuing on approval are not built yet.
