// Each person types their own access code. Codes live only in the
// GENISA_ACCESS_CODES setting on Vercel, as JSON: {"miguel":"...","ali":"..."}.
// Five wrong codes lock that name for 15 minutes.

import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const MAX_FAILURES = 5;
export const LOCK_MINUTES = 15;

export type CodeCheck = "ok" | "wrong" | "no_code" | "not_set_up";

export function parseCodes(value: string | undefined): Record<string, string> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [id, code] of Object.entries(parsed)) {
      if (typeof code === "string" && code.trim().length >= 8) out[id] = code.trim();
    }
    return out;
  } catch {
    return null;
  }
}

// Compares hashes so the time taken doesn't reveal how much of a code was right.
function sameCode(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCode(personId: string, typed: unknown, codes: Record<string, string> | null): CodeCheck {
  if (!codes) return "not_set_up";
  const expected = codes[personId];
  if (!expected) return "no_code";
  return typeof typed === "string" && sameCode(typed.trim(), expected) ? "ok" : "wrong";
}

export const accessCodes = () => parseCodes(process.env.GENISA_ACCESS_CODES);

/** When this person may try again, or null if they aren't locked out. */
export async function lockedUntil(personId: string): Promise<Date | null> {
  const [row] = await db()<{ locked_until: Date | null }[]>`
    select locked_until from genisa.sign_in_failures
    where person_id = ${personId} and locked_until > now()`;
  return row?.locked_until ?? null;
}

export async function recordFailure(personId: string): Promise<void> {
  await db()`
    insert into genisa.sign_in_failures (person_id, failures, last_failed_at)
    values (${personId}, 1, now())
    on conflict (person_id) do update set
      failures = case when genisa.sign_in_failures.locked_until <= now()
                      then 1 else genisa.sign_in_failures.failures + 1 end,
      locked_until = case
        when genisa.sign_in_failures.locked_until <= now() then null
        when genisa.sign_in_failures.failures + 1 >= ${MAX_FAILURES}
          then now() + make_interval(mins => ${LOCK_MINUTES})
        else genisa.sign_in_failures.locked_until end,
      last_failed_at = now()`;
}

export async function clearFailures(personId: string): Promise<void> {
  await db()`delete from genisa.sign_in_failures where person_id = ${personId}`;
}
