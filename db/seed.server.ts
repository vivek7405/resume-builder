// Seed: run with `bun run db:seed`. Inserts the three sample resumes when the
// table is empty, so the list and the editor render real rows while building.
import { db } from './connection.server.ts';
import { resumes } from './schema.server.ts';
import { SAMPLE_RESUMES } from '#modules/resumes/utils/sample-data.ts';

const existing = await db.query.resumes.findMany({ columns: { id: true } });
if (existing.length > 0) {
  console.log(`Seed skipped: ${existing.length} resume(s) already present.`);
} else {
  for (const sample of SAMPLE_RESUMES) {
    await db.insert(resumes).values({ title: sample.title, ...sample.doc });
  }
  console.log(`Seeded ${SAMPLE_RESUMES.length} resumes.`);
}
