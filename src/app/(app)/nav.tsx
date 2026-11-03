"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./shell.module.css";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/uploads", label: "Uploads" },
  { href: "/tours", label: "Tours" },
  { href: "/ponds", label: "Ponds" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className={styles.nav} aria-label="Main">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
