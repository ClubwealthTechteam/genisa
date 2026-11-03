import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Tours · GenISA" };

export default async function Page() {
  await requireUser();
  return (
    <ComingSoon
      title="Tours"
      phase="Phase 2"
      what={[
        "Pick a tour, with its venues pulled from Eventbrite.",
        "Keep contacts within 180 miles of a venue (adjustable per tour), judged by address first.",
        "Remove DNC, Not Interested, clients, people already registered, and anyone called in the last 90 days.",
        "Show how many contacts are left before any ponds are built."
      ]}
    />
  );
}
