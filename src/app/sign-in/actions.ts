"use server";

import { redirect } from "next/navigation";
import { allowedEmails, isAllowed } from "@/lib/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendSignInLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) redirect("/sign-in?error=email");

  // Everyone sees the same "check your email" message, so the page doesn't
  // reveal who is on the list. Only listed people are actually sent a link.
  if (isAllowed(email, allowedEmails())) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Accounts are created by invitation in Supabase, never by this form.
      options: { shouldCreateUser: false },
    });
    if (error) console.error("Sign-in link was not sent", { status: error.status, code: error.code });
  }
  redirect("/sign-in?sent=1");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
