import type { Metadata } from "next";
import { sendSignInLink } from "./actions";
import styles from "./sign-in.module.css";

export const metadata: Metadata = { title: "Sign in · GenISA" };

const ERRORS: Record<string, string> = {
  email: "Enter your full email address, for example name@clubwealth.com.",
  link: "That sign-in link has expired or was already used. Ask for a new one below.",
  not_allowed: "This email can't use GenISA. Ask Tara if you need access.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>GenISA</p>
        {sent ? (
          <>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.note}>
              If your address is on the GenISA list, a sign-in link is on its way. It works once and expires after an
              hour.
            </p>
            <a href="/sign-in" className={styles.secondary}>
              Use a different email
            </a>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.note}>We&apos;ll email you a link. No password needed.</p>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <form action={sendSignInLink} className={styles.form}>
              <label htmlFor="email" className={styles.label}>
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={styles.input}
                placeholder="name@clubwealth.com"
              />
              <button type="submit" className={styles.button}>
                Email me a sign-in link
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
