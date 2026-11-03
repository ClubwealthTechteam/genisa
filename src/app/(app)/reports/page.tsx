import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Reports · GenISA" };

export default async function Page() {
  await requireUser();
  return (
    <ComingSoon
      title="Reports"
      phase="Phase 4"
      what={[
        "Show-ups by source, pond and tour.",
        "Repeat-contact rate for each tour.",
        "Events with no check-in scans are shown as no data, never as zero."
      ]}
    />
  );
}
