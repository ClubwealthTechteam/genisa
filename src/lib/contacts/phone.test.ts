import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["(541) 973-9945", "5419739945"],
    ["602.334.8887", "6023348887"],
    ["+1 602 616 1859", "6026161859"],
    ["1-602-616-1859", "6026161859"],
    ["6023348887 ext 12", "6023348887"],
    ["602-334-8887 x4", "6023348887"],
    ["  602 334 8887  ", "6023348887"],
  ])("reads %s", (input, expected) => {
    expect(normalizePhone(input)).toEqual({ ok: true, phone: expected, areaCode: expected.slice(0, 3) });
  });

  it.each([
    ["", "empty"],
    [null, "empty"],
    ["334-8887", "wrong_length"],
    ["44 20 7946 0958", "wrong_length"],
    ["(102) 334-8887", "not_north_american"],
    ["(602) 134-8887", "not_north_american"],
    ["(602) 555-0123", "fictional"],
  ])("rejects %s", (input, reason) => {
    expect(normalizePhone(input)).toEqual({ ok: false, reason });
  });

  it("keeps real 555 numbers outside the fictional range", () => {
    expect(normalizePhone("602-555-1234").ok).toBe(true);
  });
});

describe("formatPhone", () => {
  it("formats the stored form", () => {
    expect(formatPhone("6023348887")).toBe("(602) 334-8887");
  });
  it("refuses anything that is not the stored form", () => {
    expect(() => formatPhone("602-334-8887")).toThrow();
  });
});
