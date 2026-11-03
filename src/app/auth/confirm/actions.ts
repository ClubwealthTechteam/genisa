"use server";

import { redirect } from "next/navigation";
import { allowedEmails, isAllowed } from "@/lib/auth/allowlist";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function confirmSignIn(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(tokenHash)) redirect("/sign-in?error=link");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error || !data.user) redirect("/sign-in?error=link");

  if (!isAllowed(data.user.email, allowedEmails())) {
    await supabase.auth.signOut();
    redirect("/sign-in?error=not_allowed");
  }
  redirect("/");
}
