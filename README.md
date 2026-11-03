# GenISA

Builds and tracks the ProspectBoss call lists for Club Wealth half-day events. It
replaces Ali's Python script: upload raw lead lists, clean them for a tour, split
them into ponds, export ProspectBoss CSVs, and record which contact went to which
pond and when.

Only Miguel and Ali can sign in, each with their own access code.

## Status

| Part | State |
|---|---|
| Foundation: sign-in, database tables, ProspectBoss export format | Done |
| Phase 1: uploads, format detection, dedupe, export, 2026 history | Next. Needs Ali's script and sample files |
| Phases 2 to 6 | Planned |

## How it's built

| Part | Choice | Cost |
|---|---|---|
| App | Next.js 16 (TypeScript), hosted on Vercel next to the CW AI Task Hub | Covered by the existing Vercel account |
| Database | Neon Postgres, free plan, added from Vercel → Storage | Free (0.5 GB) |
| Sign-in | Per-person access codes, the same way as the CW AI Task Hub | Free |

Rules that matter:

- **Two locks on the door.** `src/proxy.ts` turns away anyone without a valid sign-in cookie, and every page and action checks again with `requireUser()` before touching data.
- **Access codes** live only in the `GENISA_ACCESS_CODES` setting on Vercel. Five wrong codes lock that name for 15 minutes. The sign-in cookie is signed with `SESSION_SECRET` and lasts 7 days.
- **The database is server-only.** Nothing in the browser connects to it.
- **Exported ponds are permanent.** The database itself refuses to add, move or remove contacts in a pond once it is exported, or to un-export or delete it.
- **It fits the free plan.** Uploaded files and their raw rows are not stored, only the cleaned contacts and what happened to each row. Several hundred thousand contacts plus pond history fit in 0.5 GB.
- **Distance and reuse rules** are stored per tour: 180 miles and a 90-day cool-down by default.

## Setting it up (one time)

### 1. Vercel project

1. In the Vercel team that hosts the CW AI Task Hub: **Add New → Project**, import `clubwealthtechteam/genisa`. Framework preset: Next.js.
2. Under **Settings → Environment Variables**, add:
   - `SESSION_SECRET`: long random text, e.g. from `openssl rand -hex 32`.
   - `GENISA_ACCESS_CODES`: each person's code as JSON, e.g. `{"miguel":"GenISA-Miguel-XXXX","ali":"GenISA-Ali-XXXX"}`. Changing a code needs a redeploy to take effect.

### 2. Free database

1. In the project, open **Storage → Create Database → Neon (Serverless Postgres)**.
2. Choose the **Free** plan and connect it to the `genisa` project. Vercel adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.
3. Create the tables, from a computer with Node 22, using the `DATABASE_URL_UNPOOLED` value from Vercel:

   ```bash
   npm ci
   DATABASE_URL_UNPOOLED="postgresql://..." npm run db:migrate
   ```

   Running it again is safe; it only applies what's new.

### 3. Deploy

Redeploy so the settings take effect, then sign in as Miguel or Ali.

## Working on it

```bash
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
npm run check                # lint, type check, tests
```

The database tests in `db/schema.test.ts` run when `TEST_DATABASE_URL` points to a Postgres database with the migrations applied. GitHub runs all checks, the database tests included, on every push.

Never commit real lead files or exports: they contain personal data.
