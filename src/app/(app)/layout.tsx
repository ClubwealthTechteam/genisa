import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { signOut } from "../sign-in/actions";
import { Nav } from "./nav";
import ui from "@/components/ui.module.css";
import styles from "./shell.module.css";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand}>
            GenISA
          </Link>
          <Nav />
          <div className={styles.user}>
            <span className={styles.email}>{user.email}</span>
            <form action={signOut}>
              <button type="submit" className={ui.quiet}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
