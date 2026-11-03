import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { allowedEmails, isAllowed } from "./allowlist";

export type SignedInUser = { email: string };

/**
 * Call at the top of every page, server action and route handler that touches
 * data. The proxy already turns away signed-out visitors; this second check sits
 * next to the data, so a page is never served on the strength of the proxy alone.
 */
export const requireUser = cache(async (): Promise<SignedInUser> => {
  const supabase = await createSupabaseServerClient();
  // getUser asks Supabase to confirm the session, rather than trusting the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAllowed(user.email, allowedEmails())) redirect("/sign-in");
  return { email: user.email.toLowerCase() };
});
