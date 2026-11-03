import { describe, expect, it } from "vitest";
import { isAllowed, parseAllowlist, safeNextPath } from "./allowlist";

describe("allowlist", () => {
  const list = parseAllowlist(" Miguel@ClubWealth.com, ali@clubwealth.com ,, not-an-email ");

  it("reads a comma-separated list, ignoring case and blanks", () => {
    expect([...list]).toEqual(["miguel@clubwealth.com", "ali@clubwealth.com"]);
  });

  it("lets listed people in, whatever the case", () => {
    expect(isAllowed("MIGUEL@clubwealth.com", list)).toBe(true);
  });

  it("keeps everyone else out", () => {
    expect(isAllowed("austin@clubwealth.com", list)).toBe(false);
    expect(isAllowed(undefined, list)).toBe(false);
    expect(isAllowed("ali@clubwealth.com", parseAllowlist(undefined))).toBe(false);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/tours/3", "/tours/3"],
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
  ])("%s -> %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
