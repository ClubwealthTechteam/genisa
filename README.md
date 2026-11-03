# GenISA

Builds and tracks the ProspectBoss call lists for Club Wealth half-day events. It
replaces Ali's Python script: upload raw lead lists, clean them for a tour, split
them into ponds, export ProspectBoss CSVs, and record which contact went to which
pond and when.

Only the people on `ALLOWED_EMAILS` (Miguel and Ali) can sign in.

## Status

| Part | State |
|---|---|
| Foundation: sign-in, database tables, ProspectBoss export format | Done |
| Phase 1: uploads, format detection, dedupe, export, 2026 history | Next. Needs Ali's script and sample files |
| Phases 2 to 6 | Planned |

## How it's built

| Part | Choice |
|---|---|
| App | Next.js 16 (TypeScript), hosted on Vercel |
| Database and file storage | Postgres on Supabase, in its own `genisa` schema |
| Sign-in | Supabase email sign-in links, limited to `ALLOWED_EMAILS` |

Rules that matter:

- **Two locks on the door.** `src/proxy.ts` turns away anyone not signed in with a listed email, and every page and action checks again with `requireUser()` before touching data.
- **The database is server-only.** The tables live in the `genisa` schema with row level security on and no policies, so Supabase's browser-facing data API can't read them. The app reads them through `DATABASE_URL`.
- **Exported ponds are permanent.** The database itself refuses to add, move or remove contacts in a pond once it is exported, or to un-export or delete it.
- **Distance and reuse rules** are stored per tour: 180 miles and a 90-day cool-down by default.

## Setting it up (one time)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (Pro plan, so it doesn't pause).
2. **Authentication → Sign In / Providers → Email**: keep Email on. Turn off **Allow new users to sign up**.
3. **Authentication → Users → Invite user**: invite Miguel and Ali by email. They only need to accept once.
4. **Authentication → URL Configuration**: set **Site URL** to the app's address (e.g. `https://genisa.vercel.app`).
5. **Authentication → Emails → Magic Link**: change the link in the template to:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Sign in to GenISA</a>
   ```

   The link opens a page with a **Sign in** button. That extra click is on purpose: Microsoft 365's link scanner opens links in emails to check them, which would otherwise use up the one-time link before the person clicks it.
6. Supabase's built-in email sender is limited to a few emails an hour. For daily use, add an SMTP sender under **Project Settings → Authentication → SMTP**.

### 2. Database tables

From a computer with Node 22, using the **Direct connection** string from Supabase → Connect:

```bash
npm ci
DATABASE_URL_DIRECT="postgresql://postgres:PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres" npm run db:migrate
```

Running it again is safe; it only applies what's new.

### 3. Vercel

1. **Add New → Project**, import `clubwealthtechteam/genisa`. Framework preset: Next.js.
2. Under **Settings → Environment Variables**, add the values from `.env.example`:
   `SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` (the **Transaction pooler** string, port 6543) and `ALLOWED_EMAILS`.
3. Deploy, then sign in with one of the listed emails.

## Working on it

```bash
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
npm run check                # lint, type check, tests
```

The database tests in `db/schema.test.ts` run when `TEST_DATABASE_URL` points to a Postgres database with the migrations applied. GitHub runs all checks, the database tests included, on every push.

Never commit real lead files or exports: they contain personal data.
