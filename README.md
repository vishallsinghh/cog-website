# COG Website

Bilingual member, donation and assistance platform for The Council of Gujarat. See `CLAUDE.md` for the stack, folder structure and project rules.

## Getting started

1. Copy the required variables into `.env` (the full list is in `CLAUDE.md`).
2. Apply the database migrations: `npm run db:migrate:local`, then `npm run db:migrate:remote`.
3. Seed the Super Admin: `npm run db:seed`.
4. Start the app: `npm run dev` and open [http://localhost:3000](http://localhost:3000).

## Dev login (Super Admin)

| Field | Value |
| --- | --- |
| Page | `/member` |
| Mobile number | `90000 00000` (`+919000000000`) |
| Role | Super Admin, already approved |

1. Open `/member`, stay on the **Sign in** tab and enter `9000000000`.
2. Press **Send code**. In development no SMS is sent: the code is printed in the terminal running `npm run dev`, on a line that starts with `[dev-otp] +919000000000:`.
3. Enter that 6-digit code to sign in. The session lasts 30 days.

The number and name come from `SUPER_ADMIN_PHONE` and `SUPER_ADMIN_NAME` in `.env`. Running `npm run db:seed` again is safe and only updates the same account.

Before go-live, replace this dummy number: set `SUPER_ADMIN_PHONE` to a real number the owner controls, run the seed, then ban or delete the dummy account. In production the code is sent through MSG91, so anyone who owns `+919000000000` could otherwise receive it.

## Sign-up and approval

New members sign up with name, mobile number and Aadhaar, then verify the code. Their account stays `pending` and they cannot log in until an admin approves it. The Super Admin account above is the only account that can log in out of the box.

## Scripts

- `npm run dev`: start locally
- `npm run typecheck`: TypeScript check
- `npm run lint`: ESLint
- `npm run db:migration:new -- <name>`, `db:migration:diff`, `db:migrate:local`, `db:migrate:remote`, `db:generate`, `db:seed`: database workflow, explained in `CLAUDE.md`
