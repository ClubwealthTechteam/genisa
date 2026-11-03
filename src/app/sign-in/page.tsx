import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";
import styles from "./sign-in.module.css";

export const metadata: Metadata = { title: "Sign in · GenISA" };

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>GenISA</p>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.note}>Pick your name and type your access code.</p>
        <SignInForm />
      </div>
    </main>
  );
}
