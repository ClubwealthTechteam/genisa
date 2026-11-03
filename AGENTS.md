<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## GenISA rules

- Every page, server action and route handler that touches data starts with `await requireUser()` (`src/lib/auth/require-user.ts`). The proxy alone is not enough.
- Database access is server-only, through `db()` in `src/lib/db.ts`, against the `genisa` schema. Never read GenISA tables from the browser.
- Schema changes go in a new numbered file in `db/migrations/`. Never edit a migration that has been applied.
- Phones are stored as 10 digits (`normalizePhone`). Emails are stored lowercase.
- An exported pond is a permanent record. The database refuses changes to it; don't work around that.
- The database is Neon's free plan (0.5 GB). Don't store raw uploaded rows or files in it; keep tables lean.
- Sign-in is per-person access codes (`GENISA_ACCESS_CODES`), checked in `src/lib/auth/`. Add people in `src/config/people.ts`.
- Contact data is personal data. Never commit real lead files, exports or `.env*` files (other than `.env.example`).
- Run `npm run check` before pushing. Set `TEST_DATABASE_URL` to also run the database tests.
