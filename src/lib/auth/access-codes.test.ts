import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkCode, parseCodes } from "./access-codes";

describe("access codes", () => {
  const codes = parseCodes('{"miguel":"GenISA-Miguel-7Q2K","ali":"GenISA-Ali-9XW4","short":"abc"}');

  it("reads the JSON setting and ignores codes under 8 characters", () => {
    expect(codes).toEqual({ miguel: "GenISA-Miguel-7Q2K", ali: "GenISA-Ali-9XW4" });
  });

  it("treats a missing or broken setting as not set up", () => {
    expect(parseCodes(undefined)).toBeNull();
    expect(parseCodes("not json")).toBeNull();
    expect(parseCodes('["a"]')).toBeNull();
    expect(checkCode("ali", "anything", null)).toBe("not_set_up");
  });

  it("accepts only the person's own code", () => {
    expect(checkCode("ali", "GenISA-Ali-9XW4", codes)).toBe("ok");
    expect(checkCode("ali", " GenISA-Ali-9XW4 ", codes)).toBe("ok");
    expect(checkCode("ali", "GenISA-Miguel-7Q2K", codes)).toBe("wrong");
    expect(checkCode("ali", "genisa-ali-9xw4", codes)).toBe("wrong");
    expect(checkCode("ali", undefined, codes)).toBe("wrong");
    expect(checkCode("austin", "GenISA-Ali-9XW4", codes)).toBe("no_code");
  });
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("wrong-code lockout", () => {
  let mod: typeof import("./access-codes");
  const person = `test-${Date.now()}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    mod = await import("./access-codes");
  });
  afterAll(async () => {
    const { db } = await import("@/lib/db");
    await db()`delete from genisa.sign_in_failures where person_id = ${person}`;
    await db().end();
  });

  it("locks a name after five wrong codes, not before", async () => {
    for (let i = 1; i < mod.MAX_FAILURES; i++) await mod.recordFailure(person);
    expect(await mod.lockedUntil(person)).toBeNull();
    await mod.recordFailure(person);
    const until = await mod.lockedUntil(person);
    expect(until).not.toBeNull();
    const mins = (until!.getTime() - Date.now()) / 60000;
    expect(mins).toBeGreaterThan(mod.LOCK_MINUTES - 1);
    expect(mins).toBeLessThanOrEqual(mod.LOCK_MINUTES);
  });

  it("unlocks after a correct sign-in clears the count", async () => {
    await mod.clearFailures(person);
    expect(await mod.lockedUntil(person)).toBeNull();
  });
});
