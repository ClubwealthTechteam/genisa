import "server-only";
import postgres from "postgres";

// One connection pool per server instance. On Vercel, DATABASE_URL is Supabase's
// transaction pooler, which does not support prepared statements.
const globalForDb = globalThis as unknown as { genisaSql?: postgres.Sql };

export function db(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  globalForDb.genisaSql ??= postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
  return globalForDb.genisaSql;
}
