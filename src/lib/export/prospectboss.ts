// Writes a pond as a CSV that ProspectBoss imports. The columns and their order
// match the files Ali's script produces today.
//
// TO CONFIRM against Ali's output in Phase 1: the phone format, and what goes
// in "List Type". Both are set in one place below so they are easy to change.

import { formatPhone } from "@/lib/contacts/phone";

export const PROSPECTBOSS_COLUMNS = [
  "List Type",
  "First Name",
  "Last Name",
  "Name",
  "Company",
  "Phone",
  "Email",
  "Address 1",
  "City",
  "State",
  "Zip",
] as const;

export type ExportContact = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  /** Stored form: 10 digits. */
  phone?: string | null;
  email?: string | null;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

function clean(value: string | null | undefined): string {
  // Collapse line breaks and runs of spaces, which break some importers.
  return (value ?? "").replace(/\s+/g, " ").trim();
}

// Spreadsheet programs treat a cell starting with = + - @ as a formula. A
// leading apostrophe makes it plain text when someone opens the file in Excel.
function neutralizeFormula(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toProspectBossRow(listType: string, c: ExportContact): string[] {
  const first = clean(c.firstName);
  const last = clean(c.lastName);
  return [
    clean(listType),
    first,
    last,
    [first, last].filter(Boolean).join(" "),
    clean(c.company),
    c.phone ? formatPhone(c.phone) : "",
    clean(c.email).toLowerCase(),
    clean(c.address1),
    clean(c.city),
    clean(c.state).toUpperCase(),
    clean(c.zip),
  ].map(neutralizeFormula);
}

/** The whole file, header first, with Windows line endings as CSV expects. */
export function toProspectBossCsv(listType: string, contacts: ExportContact[]): string {
  const lines = [PROSPECTBOSS_COLUMNS as readonly string[], ...contacts.map((c) => toProspectBossRow(listType, c))];
  return lines.map((cells) => cells.map(csvField).join(",")).join("\r\n") + "\r\n";
}
