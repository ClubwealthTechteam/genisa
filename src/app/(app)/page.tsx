import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import ui from "@/components/ui.module.css";
import styles from "./shell.module.css";

type Counts = { contacts: number; uploads: number; tours: number; ponds: number };

async function loadCounts(): Promise<Counts | null> {
  try {
    const [row] = await db()<Counts[]>`
      select
        (select count(*) from genisa.contacts)::int as contacts,
        (select count(*) from genisa.uploads)::int  as uploads,
        (select count(*) from genisa.tours)::int    as tours,
        (select count(*) from genisa.ponds)::int    as ponds`;
    return row;
  } catch (err) {
    console.error("Overview could not reach the database", err instanceof Error ? err.message : err);
    return null;
  }
}

const PHASES = [
  { name: "Foundation", note: "Sign-in, database, ProspectBoss export format", state: "done" },
  { name: "Phase 1: Match Ali's script", note: "Uploads, format detection, dedupe, export, 2026 history", state: "next" },
  { name: "Phase 2: Tour and cleaning", note: "Eventbrite venues, distance, exclusions, pool preview", state: "later" },
  { name: "Phase 3: Ponds and export", note: "Build and lock ponds, record every assignment", state: "later" },
  { name: "Phase 4: Reporting", note: "Show-ups by source and pond, repeat rate per tour", state: "later" },
  { name: "Phase 5: AI check and top-up", note: "Verify flagged leads, top up thin areas", state: "later" },
  { name: "Phase 6: Scheduled routine", note: "Weekly draft ponds with Slack notice and approval", state: "later" },
] as const;

const PILL = { done: ui.ok, next: ui.warn, later: ui.later };
const PILL_TEXT = { done: "Done", next: "Next", later: "Planned" };

export default async function OverviewPage() {
  await requireUser();
  const counts = await loadCounts();

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Overview</h1>
        <p className={styles.lede}>
          GenISA builds the ProspectBoss call lists for half-day events and records which contact went to which pond.
        </p>
      </div>

      <section className={styles.panel} aria-labelledby="data-heading">
        <h2 id="data-heading">Data so far</h2>
        {counts ? (
          <div className={styles.counts}>
            <div className={styles.count}>
              <div className={styles.countValue}>{counts.contacts.toLocaleString()}</div>
              <div className={styles.countLabel}>contacts</div>
            </div>
            <div className={styles.count}>
              <div className={styles.countValue}>{counts.uploads.toLocaleString()}</div>
              <div className={styles.countLabel}>uploaded files</div>
            </div>
            <div className={styles.count}>
              <div className={styles.countValue}>{counts.tours.toLocaleString()}</div>
              <div className={styles.countLabel}>tours</div>
            </div>
            <div className={styles.count}>
              <div className={styles.countValue}>{counts.ponds.toLocaleString()}</div>
              <div className={styles.countLabel}>ponds</div>
            </div>
          </div>
        ) : (
          <p className={ui.warn}>The database isn&apos;t reachable. Check DATABASE_URL in the Vercel settings.</p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="build-heading">
        <h2 id="build-heading">Build progress</h2>
        <ul className={styles.steps}>
          {PHASES.map((p) => (
            <li key={p.name}>
              <div>
                <div className={styles.stepName}>{p.name}</div>
                <div className={styles.stepNote}>{p.note}</div>
              </div>
              <span className={PILL[p.state]}>{PILL_TEXT[p.state]}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
