import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Ponds · GenISA" };

export default async function Page() {
  await requireUser();
  return (
    <ComingSoon
      title="Ponds"
      phase="Phase 3"
      what={[
        "Split a tour's cleaned list into ponds of about 988.",
        "Export each pond as a ProspectBoss CSV.",
        "Record which contact went to which pond and when, and lock the pond once exported."
      ]}
    />
  );
}
