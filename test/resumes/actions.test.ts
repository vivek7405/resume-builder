// Drives every resume action through its REAL RPC endpoint (serializer, CSRF,
// error sanitization), the same path the autosave island uses.
process.env.DATABASE_URL ||= 'file:./db/dev.db';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler, invokeActionForTest } from '@webjsdev/server';
import type { ActionResult } from '@webjsdev/server';
import type { ResumeData } from '#modules/resumes/types.ts';

const appDir = process.cwd();
let app: Awaited<ReturnType<typeof createRequestHandler>>;
const created: string[] = [];

function fd(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.set(k, v);
  return data;
}

const call = <T>(file: string, fn: string, data: FormData) =>
  invokeActionForTest<ActionResult<T>>(app, `modules/resumes/actions/${file}.server.ts`, fn, [data], { throwOnError: false });

before(async () => {
  app = await createRequestHandler({ appDir, dev: true });
});

after(async () => {
  for (const id of created) await call('delete-resume', 'deleteResume', fd({ resumeId: id }));
});

test('createResume needs a title, then opens the editor', async () => {
  const bad = await call<ResumeData>('create-resume', 'createResume', fd({ title: '   ' }));
  assert.equal(bad.success, false);
  assert.ok(!bad.success && bad.fieldErrors?.title);

  const ok = await call<ResumeData>('create-resume', 'createResume', fd({ title: 'Test: created', template: 'modern' }));
  assert.ok(ok.success && ok.data);
  if (!ok.success || !ok.data) return;
  created.push(ok.data.id);
  assert.equal(ok.data.template, 'modern');
  assert.equal(ok.redirect, `/resumes/${ok.data.id}`);
  assert.deepEqual(ok.data.experience, []);
});

test('profile, settings and skills writes replace their section', async () => {
  const made = await call<ResumeData>('create-resume', 'createResume', fd({ title: 'Test: sections' }));
  assert.ok(made.success && made.data);
  if (!made.success || !made.data) return;
  const id = made.data.id;
  created.push(id);

  const badEmail = await call('update-profile', 'updateProfile', fd({ resumeId: id, fullName: 'Ada', email: 'nope' }));
  assert.ok(!badEmail.success && badEmail.fieldErrors?.email);

  const profile = await call('update-profile', 'updateProfile', fd({ resumeId: id, fullName: 'Ada Lovelace', email: 'ada@example.com', summary: 'Analyst.' }));
  assert.equal(profile.success, true);

  const noTitle = await call('update-settings', 'updateSettings', fd({ resumeId: id, title: '', template: 'minimal' }));
  assert.ok(!noTitle.success && noTitle.fieldErrors?.title);
  const settings = await call('update-settings', 'updateSettings', fd({ resumeId: id, title: 'Test: renamed', template: 'minimal', accent: '#0f766e' }));
  assert.equal(settings.success, true);

  const skills = await call('update-skills', 'updateSkills', fd({ resumeId: id, skills: 'Go, Rust\nSQL' }));
  assert.equal(skills.success, true);

  const row = await invokeActionForTest<ResumeData | null>(app, 'modules/resumes/queries/get-resume.server.ts', 'getResume', [id]);
  assert.ok(row);
  assert.equal(row.profile.fullName, 'Ada Lovelace');
  assert.equal(row.title, 'Test: renamed');
  assert.equal(row.template, 'minimal');
  assert.equal(row.accent, '#0f766e');
  assert.deepEqual(row.skills, ['Go', 'Rust', 'SQL']);
});

test('entries can be added, saved, moved and removed', async () => {
  const made = await call<ResumeData>('create-resume', 'createResume', fd({ title: 'Test: entries' }));
  assert.ok(made.success && made.data);
  if (!made.success || !made.data) return;
  const id = made.data.id;
  created.push(id);

  const first = await call<{ index: number }>('add-entry', 'addEntry', fd({ resumeId: id, section: 'experience' }));
  const second = await call<{ index: number }>('add-entry', 'addEntry', fd({ resumeId: id, section: 'experience' }));
  assert.ok(first.success && second.success);
  assert.equal(second.success && second.data?.index, 1);
  assert.equal(second.success && second.redirect, `/resumes/${id}#experience-1`);

  const saved = await call('save-entry', 'saveEntry', fd({ resumeId: id, section: 'experience', index: '1', company: 'Lumen', role: 'Engineer', start: '2021-03', current: 'on', highlights: 'Shipped it' }));
  assert.equal(saved.success, true);
  const stale = await call('save-entry', 'saveEntry', fd({ resumeId: id, section: 'experience', index: '7', company: 'x' }));
  assert.equal(stale.success, false);
  const unknown = await call('save-entry', 'saveEntry', fd({ resumeId: id, section: 'nope', index: '0' }));
  assert.equal(unknown.success, false);

  const moved = await call<{ index: number }>('move-entry', 'moveEntry', fd({ resumeId: id, section: 'experience', index: '1', direction: 'up' }));
  assert.ok(moved.success && moved.data?.index === 0);

  let row = await invokeActionForTest<ResumeData>(app, 'modules/resumes/queries/get-resume.server.ts', 'getResume', [id]);
  assert.equal(row.experience[0].company, 'Lumen');
  assert.equal(row.experience[0].current, true);
  assert.equal(row.experience[1].company, '');

  const removed = await call<{ count: number }>('remove-entry', 'removeEntry', fd({ resumeId: id, section: 'experience', index: '1' }));
  assert.ok(removed.success && removed.data?.count === 1);
  row = await invokeActionForTest<ResumeData>(app, 'modules/resumes/queries/get-resume.server.ts', 'getResume', [id]);
  assert.equal(row.experience.length, 1);
});

test('duplicateResume copies the document under a new name', async () => {
  const made = await call<ResumeData>('create-resume', 'createResume', fd({ title: 'Test: original' }));
  assert.ok(made.success && made.data);
  if (!made.success || !made.data) return;
  created.push(made.data.id);
  await call('update-skills', 'updateSkills', fd({ resumeId: made.data.id, skills: 'Go' }));

  const copy = await call<ResumeData>('duplicate-resume', 'duplicateResume', fd({ resumeId: made.data.id }));
  assert.ok(copy.success && copy.data);
  if (!copy.success || !copy.data) return;
  created.push(copy.data.id);
  assert.equal(copy.data.title, 'Copy of Test: original');
  assert.notEqual(copy.data.id, made.data.id);
  assert.deepEqual(copy.data.skills, ['Go']);

  const missing = await call('duplicate-resume', 'duplicateResume', fd({ resumeId: 'does-not-exist' }));
  assert.equal(missing.success, false);
});

test('generateSample inserts a complete built-in sample in the requested template', async () => {
  const result = await call<ResumeData>('generate-sample', 'generateSample', fd({ template: 'minimal' }));
  assert.ok(result.success && result.data);
  if (!result.success || !result.data) return;
  created.push(result.data.id);
  assert.equal(result.data.template, 'minimal');
  assert.ok(result.data.experience.length >= 1, 'a complete sample has experience');
  assert.ok(result.data.profile.fullName, 'a complete sample has a name');
  assert.equal(result.redirect, `/resumes/${result.data.id}?sample=1`);
});

test('listResumes searches title and name, and deleteResume removes a row', async () => {
  const made = await call<ResumeData>('create-resume', 'createResume', fd({ title: 'Test: findme zebra' }));
  assert.ok(made.success && made.data);
  if (!made.success || !made.data) return;
  const id = made.data.id;

  const hits = await invokeActionForTest<ResumeData[]>(app, 'modules/resumes/queries/list-resumes.server.ts', 'listResumes', [{ q: 'ZEBRA' }]);
  assert.ok(hits.some((r) => r.id === id));
  const misses = await invokeActionForTest<ResumeData[]>(app, 'modules/resumes/queries/list-resumes.server.ts', 'listResumes', [{ q: 'no-such-resume-xyz' }]);
  assert.equal(misses.length, 0);

  const gone = await call('delete-resume', 'deleteResume', fd({ resumeId: id }));
  assert.ok(gone.success && gone.redirect === '/resumes');
  const after = await invokeActionForTest<ResumeData | null>(app, 'modules/resumes/queries/get-resume.server.ts', 'getResume', [id]);
  assert.equal(after, null);
});
