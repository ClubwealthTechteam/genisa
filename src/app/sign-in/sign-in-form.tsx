"use client";

import { useActionState } from "react";
import { PEOPLE } from "@/config/people";
import { signIn, type SignInState } from "./actions";
import styles from "./sign-in.module.css";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className={styles.form}>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <label htmlFor="person" className={styles.label}>
        Name
      </label>
      <select id="person" name="person" required
        // React clears the form after each try; a new key re-creates the box with the name just used.
        key={state.attempt ?? 0}
        defaultValue={state.personId ?? ""} className={styles.input}>
        <option value="" disabled>
          Choose…
        </option>
        {PEOPLE.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <label htmlFor="code" className={styles.label}>
        Access code
      </label>
      <input id="code" name="code" type="password" autoComplete="current-password" required className={styles.input} />
      <button type="submit" className={styles.button} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
