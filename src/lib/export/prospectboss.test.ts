import { describe, expect, it } from "vitest";
import { PROSPECTBOSS_COLUMNS, toProspectBossCsv, toProspectBossRow } from "./prospectboss";

describe("ProspectBoss export", () => {
  it("uses the ProspectBoss columns in order", () => {
    const header = toProspectBossCsv("Scottsdale Pond 1", []).split("\r\n")[0];
    expect(header).toBe("List Type,First Name,Last Name,Name,Company,Phone,Email,Address 1,City,State,Zip");
    expect(PROSPECTBOSS_COLUMNS).toHaveLength(11);
  });

  it("fills every column from a contact", () => {
    const row = toProspectBossRow("Scottsdale Pond 1", {
      firstName: "Kris",
      lastName: "McLaughlin",
      company: "Retsy",
      phone: "6023348887",
      email: "Kris@Example.com",
      address1: "7316 E 6th Ave",
      city: "Scottsdale",
      state: "az",
      zip: "85251",
    });
    expect(row).toEqual([
      "Scottsdale Pond 1",
      "Kris",
      "McLaughlin",
      "Kris McLaughlin",
      "Retsy",
      "(602) 334-8887",
      "kris@example.com",
      "7316 E 6th Ave",
      "Scottsdale",
      "AZ",
      "85251",
    ]);
  });

  it("leaves missing values empty and builds Name from what exists", () => {
    const row = toProspectBossRow("P1", { lastName: "Church", phone: "6026161859" });
    expect(row[3]).toBe("Church");
    expect(row[6]).toBe("");
    expect(row[10]).toBe("");
  });

  it("quotes commas and quotes, and flattens line breaks", () => {
    const csv = toProspectBossCsv("P1", [{ firstName: "Ana", company: 'Smith, "The Agent"\nGroup', phone: "6026161859" }]);
    expect(csv.split("\r\n")[1]).toBe('P1,Ana,,Ana,"Smith, ""The Agent"" Group",(602) 616-1859,,,,,');
  });

  it("stops spreadsheet formulas in text fields", () => {
    const row = toProspectBossRow("P1", { firstName: "=HYPERLINK(\"x\")", company: "@home", phone: "6026161859" });
    expect(row[1]).toBe("'=HYPERLINK(\"x\")");
    expect(row[4]).toBe("'@home");
  });

  it("ends every line with CRLF", () => {
    const csv = toProspectBossCsv("P1", [{ firstName: "A", phone: "6026161859" }]);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n")).toHaveLength(3);
  });
});
