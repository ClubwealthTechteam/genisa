// Checks the database rules that protect the pond history. Runs against a real
// Postgres with the migrations applied; skipped when TEST_DATABASE_URL is unset.
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const sql = url ? postgres(url, { max: 1, onnotice: () => {} }) : null;

async function setup() {
  const db = sql!;
  const [tour] = await db`insert into genisa.tours (name, created_by) values ('Test tour', 'test@clubwealth.com') returning id`;
  const [other] = await db`insert into genisa.tours (name, created_by) values ('Other tour', 'test@clubwealth.com') returning id`;
  const [pond] = await db`insert into genisa.ponds (tour_id, pond_number, list_type) values (${tour.id}, 1, 'Test Pond 1') returning id`;
  const [a] = await db`insert into genisa.contacts (first_name, phone) values ('A', '6023348887') returning id`;
  const [b] = await db`insert into genisa.contacts (first_name, phone) values ('B', '6026161859') returning id`;
  return { tour: tour.id, other: other.id, pond: pond.id, a: a.id, b: b.id };
}

describe.skipIf(!sql)("database rules", () => {
  let ids: Awaited<ReturnType<typeof setup>>;
  beforeAll(async () => {
    ids = await setup();
  });
  afterAll(async () => {
    await sql?.end();
  });

  it("puts a contact in at most one pond per tour", async () => {
    await sql!`insert into genisa.pond_assignments (pond_id, tour_id, contact_id) values (${ids.pond}, ${ids.tour}, ${ids.a})`;
    const [pond2] = await sql!`insert into genisa.ponds (tour_id, pond_number, list_type) values (${ids.tour}, 2, 'Test Pond 2') returning id`;
    await expect(
      sql!`insert into genisa.pond_assignments (pond_id, tour_id, contact_id) values (${pond2.id}, ${ids.tour}, ${ids.a})`,
    ).rejects.toThrow(/duplicate key/);
  });

  it("rejects an assignment whose tour does not match its pond", async () => {
    await expect(
      sql!`insert into genisa.pond_assignments (pond_id, tour_id, contact_id) values (${ids.pond}, ${ids.other}, ${ids.b})`,
    ).rejects.toThrow(/does not belong to tour/);
  });

  it("locks a pond once it is exported", async () => {
    await sql!`update genisa.ponds set exported_at = now(), exported_by = 'test@clubwealth.com' where id = ${ids.pond}`;

    await expect(
      sql!`insert into genisa.pond_assignments (pond_id, tour_id, contact_id) values (${ids.pond}, ${ids.tour}, ${ids.b})`,
    ).rejects.toThrow(/cannot be added/);
    await expect(sql!`delete from genisa.pond_assignments where pond_id = ${ids.pond}`).rejects.toThrow(/cannot be changed/);
    await expect(sql!`update genisa.ponds set exported_at = null, exported_by = null where id = ${ids.pond}`).rejects.toThrow(
      /cannot be changed/,
    );
    await expect(sql!`update genisa.ponds set list_type = 'Renamed' where id = ${ids.pond}`).rejects.toThrow(/cannot be changed/);
    await expect(sql!`delete from genisa.ponds where id = ${ids.pond}`).rejects.toThrow(/cannot be deleted/);
  });

  it("only stores phones in the 10-digit form", async () => {
    await expect(sql!`insert into genisa.contacts (phone) values ('(602) 334-8887')`).rejects.toThrow(/check constraint/);
  });

  it("requires a tour for a 'registered' exclusion", async () => {
    await expect(
      sql!`insert into genisa.exclusions (phone, reason, origin) values ('6023348887', 'registered', 'eventbrite')`,
    ).rejects.toThrow(/check constraint/);
  });
});
