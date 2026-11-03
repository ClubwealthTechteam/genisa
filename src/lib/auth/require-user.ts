import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { personById, type Person } from "@/config/people";
import { SESSION_COOKIE, verifySession } from "./session";

/** The signed-in person, or null. */
export const currentUser = cache(async (): Promise<Person | null> => {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return (session && personById(session.uid)) || null;
});

/**
 * Call at the top of every page, server action and route handler that touches
 * data. The proxy already turns away signed-out visitors; this second check sits
 * next to the data, so a page is never served on the strength of the proxy alone.
 */
export async function requireUser(): Promise<Person> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return user;
}
