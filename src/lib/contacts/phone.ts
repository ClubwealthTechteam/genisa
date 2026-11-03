// Phone numbers arrive in every format: "(602) 334-8887", "602.334.8887",
// "+1 602 334 8887", "6023348887 ext 12". GenISA stores one form: the 10 digits
// of a North American number, e.g. "6023348887". Anything else is rejected
// rather than guessed at.

export type PhoneResult =
  | { ok: true; phone: string; areaCode: string }
  | { ok: false; reason: "empty" | "wrong_length" | "not_north_american" | "fictional" };

const EXTENSION = /\s*(?:#|x|ext\.?|extension)\s*\d+\s*$/i;

export function normalizePhone(input: string | null | undefined): PhoneResult {
  const raw = (input ?? "").trim().replace(EXTENSION, "");
  if (raw === "") return { ok: false, reason: "empty" };

  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return { ok: false, reason: "wrong_length" };

  // Area code and exchange both start with 2-9 in the North American plan.
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) return { ok: false, reason: "not_north_american" };
  // 555-0100 to 555-0199 are reserved for fiction.
  if (/^\d{3}55501\d{2}$/.test(digits)) return { ok: false, reason: "fictional" };

  return { ok: true, phone: digits, areaCode: digits.slice(0, 3) };
}

/** "6023348887" -> "(602) 334-8887" */
export function formatPhone(phone: string): string {
  if (!/^\d{10}$/.test(phone)) throw new Error(`Not a stored phone number: ${phone}`);
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
}
