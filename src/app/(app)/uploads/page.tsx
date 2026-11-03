import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Uploads · GenISA" };

export default async function Page() {
  await requireUser();
  return (
    <ComingSoon
      title="Uploads"
      phase="Phase 1"
      what={[
        "Upload raw lists from Keap, Courted.io, Model Match, DrBill, REality, AI2026 and website scrapes.",
        "Detect each file's source and column layout automatically.",
        "Merge duplicates into one contact and show what was new, merged or rejected, and why."
      ]}
    />
  );
}
