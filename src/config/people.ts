// The people who can sign in to GenISA. Each one's access code is set in
// GENISA_ACCESS_CODES on Vercel, keyed by the id here.

export type Person = { id: string; name: string };

export const PEOPLE: readonly Person[] = [
  { id: "miguel", name: "Miguel" },
  { id: "ali", name: "Ali" },
];

export function personById(id: unknown): Person | undefined {
  return typeof id === "string" ? PEOPLE.find((p) => p.id === id) : undefined;
}
