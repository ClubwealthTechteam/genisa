import type { Metadata } from "next";
import { confirmSignIn } from "./actions";
import styles from "../../sign-in/sign-in.module.css";

export const metadata: Metadata = { title: "Sign in · GenISA" };

// The emailed link opens this page and nothing more. Signing in takes a click,
// because email security scanners (such as Microsoft's Safe Links) open links
// to check them, and would otherwise use up the one-time link before you do.
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>GenISA</p>
        {tokenHash ? (
          <>
            <h1 className={styles.title}>Finish signing in</h1>
            <form action={confirmSignIn} className={styles.form}>
              <input type="hidden" name="token_hash" value={tokenHash} />
              <button type="submit" className={styles.button}>
                Sign in to GenISA
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className={styles.title}>This link is incomplete</h1>
            <p className={styles.note}>
              Open the most recent sign-in email and use its button, or <a href="/sign-in">ask for a new link</a>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
