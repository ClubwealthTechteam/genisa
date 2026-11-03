"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { personById } from "@/config/people";
import { accessCodes, checkCode, clearFailures, lockedUntil, recordFailure } from "@/lib/auth/access-codes";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";

export type SignInState = { error?: string; personId?: string; attempt?: number };

export async function signIn(prev: SignInState, formData: FormData): Promise<SignInState> {
  const person = personById(formData.get("person"));
  const attempt = (prev.attempt ?? 0) + 1;
  if (!person) return { attempt, error: "Pick your name." };

  const until = await lockedUntil(person.id);
  if (until) {
    const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
    return { personId: person.id, attempt, error: `Too many wrong codes. Try again in ${mins} minute${mins > 1 ? "s" : ""}.` };
  }

  const result = checkCode(person.id, formData.get("code"), accessCodes());
  if (result === "not_set_up") return { personId: person.id, attempt, error: "Sign-in isn't set up yet. GENISA_ACCESS_CODES is missing on Vercel." };
  if (result === "no_code") return { personId: person.id, attempt, error: "You don't have an access code yet. Ask Tara for yours." };
  if (result === "wrong") {
    await recordFailure(person.id);
    return { personId: person.id, attempt, error: "That access code is wrong." };
  }

  await clearFailures(person.id);
  (await cookies()).set(SESSION_COOKIE, signSession(person.id), sessionCookieOptions);
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/sign-in");
}
