import ui from "./ui.module.css";
import styles from "../app/(app)/shell.module.css";

export function ComingSoon({ title, phase, what }: { title: string; phase: string; what: string[] }) {
  return (
    <>
      <div className={styles.pageHead}>
        <span className={ui.later}>Arrives in {phase}</span>
        <h1>{title}</h1>
      </div>
      <section className={styles.panel}>
        <h2>What this page will do</h2>
        <ul>
          {what.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
