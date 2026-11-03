// The signed-in person is kept in a cookie signed with SESSION_SECRET
// (HMAC-SHA256), the same way as the CW AI Task Hub. Nobody can make or change
// a valid cookie without the secret.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "genisa_session";
export const SESSION_DAYS = 7;

export type SessionPayload = { uid: string; exp: number };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-insecure-secret-not-for-production";
  throw new Error("SESSION_SECRET must be set to at least 32 random characters.");
}

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function signSession(uid: string, now = Date.now()): string {
  const payload: SessionPayload = { uid, exp: now + SESSION_DAYS * 864e5 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySession(token: string | undefined | null, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    return payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};
