import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenISA",
  description: "Builds and tracks the ProspectBoss call lists for Club Wealth half-day events.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
