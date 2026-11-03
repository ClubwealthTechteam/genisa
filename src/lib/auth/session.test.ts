import { describe, expect, it } from "vitest";
import { SESSION_DAYS, signSession, verifySession } from "./session";

describe("session cookie", () => {
  it("round-trips a person id", () => {
    const now = Date.UTC(2026, 10, 3);
    expect(verifySession(signSession("ali", now), now)).toEqual({ uid: "ali", exp: now + SESSION_DAYS * 864e5 });
  });

  it("refuses a changed cookie", () => {
    const token = signSession("ali");
    const [, sig] = token.split(".");
    const forged = `${Buffer.from(JSON.stringify({ uid: "miguel", exp: Date.now() + 1e9 })).toString("base64url")}.${sig}`;
    expect(verifySession(forged)).toBeNull();
    expect(verifySession(`${token}x`)).toBeNull();
    expect(verifySession(`${token}.extra`)).toBeNull();
  });

  it("refuses an expired cookie", () => {
    const issued = Date.UTC(2026, 0, 1);
    expect(verifySession(signSession("ali", issued), issued + (SESSION_DAYS + 1) * 864e5)).toBeNull();
  });

  it("refuses empty or junk values", () => {
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession("")).toBeNull();
    expect(verifySession("not-a-token")).toBeNull();
  });
});
