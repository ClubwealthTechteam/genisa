// Only the people listed in ALLOWED_EMAILS (comma separated) can use GenISA.
// This check runs on every request and again before any data is read, so a
// Supabase account on its own is not enough to get in.

export function parseAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isAllowed(email: string | null | undefined, allowlist: Set<string>): boolean {
  if (!email) return false;
  return allowlist.has(email.trim().toLowerCase());
}

export function allowedEmails(): Set<string> {
  return parseAllowlist(process.env.ALLOWED_EMAILS);
}

/** Only same-site paths, so a sign-in link can't send someone to another website. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}
