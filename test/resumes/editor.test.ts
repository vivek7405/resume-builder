// The editor page with JavaScript off: every section is a bound form that
// posts back to the page (303), and a validation failure re-renders the
// editor at 422 with the error beside the field that caused it.
process.env.DATABASE_URL ||= 'file:./db/dev.db';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler, invokeActionForTest } from '@webjsdev/server';
import { testRequest, submitForm } from '@webjsdev/server/testing';
import type { ResumeData } from '#modules/resumes/types.ts';

let app: Awaited<ReturnType<typeof createRequestHandler>>;
let id = '';
const editor = () => `/resumes/${id}`;
const read = () => invokeActionForTest<ResumeData>(app, 'modules/resumes/queries/get-resume.server.ts', 'getResume', [id]);

before(async () => {
  app = await createRequestHandler({ appDir: process.cwd(), dev: true });
  const made = await submitForm(app.handle, '/resumes/new', { title: 'Test: editor', template: 'classic' }, { match: 'name="title"' });
  id = (made.headers.get('location') ?? '').split('/').pop() ?? '';
});
after(async () => {
  const fd = new FormData();
  fd.set('resumeId', id);
  await invokeActionForTest(app, 'modules/resumes/actions/delete-resume.server.ts', 'deleteResume', [fd]);
});

test('the editor renders every section form and the preview seeded with the resume', async () => {
  const res = await testRequest(app.handle, editor());
  assert.equal(res.status, 200);
  const body = await res.text();
  for (const section of ['profile', 'skills', 'settings']) assert.match(body, new RegExp(`<draft-form section="${section}"`));
  for (const section of ['experience', 'education', 'projects']) assert.match(body, new RegExp(`name="section" value="${section}"`));
  assert.match(body, /<resume-preview/);
  assert.match(body, /Your name/);
  assert.match(body, /Preview and print/);
});

test('profile: a bad email re-renders at 422 with the error, a good one saves', async () => {
  const bad = await submitForm(app.handle, editor(), { resumeId: id, section: 'profile', index: '0', fullName: 'Ada', email: 'nope' }, { match: 'name="fullName"' });
  assert.equal(bad.status, 422);
  const body = await bad.text();
  assert.match(body, /That does not look like an email address/);
  assert.match(body, /id="email"[^>]*aria-invalid="true"/);
  assert.match(body, /value="Ada"/);

  const ok = await submitForm(app.handle, editor(), { resumeId: id, section: 'profile', index: '0', fullName: 'Ada Lovelace', headline: 'Analyst', email: 'ada@example.com' }, { match: 'name="fullName"' });
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get('location'), editor());
  assert.equal((await read()).profile.fullName, 'Ada Lovelace');
});

test('experience: add, save, move and remove through the page forms', async () => {
  const added = await submitForm(app.handle, editor(), { resumeId: id, section: 'experience', index: '0' }, { match: 'name="add" value="experience"' });
  assert.equal(added.status, 303);
  assert.equal(added.headers.get('location'), `${editor()}#experience-0`);
  const again = await submitForm(app.handle, editor(), { resumeId: id, section: 'experience', index: '0' }, { match: 'name="add" value="experience"' });
  assert.equal(again.headers.get('location'), `${editor()}#experience-1`);

  const saved = await submitForm(app.handle, editor(), { resumeId: id, section: 'experience', index: '1', role: 'Engineer', company: 'Lumen', start: '2021-03', current: 'on', highlights: 'Shipped it' }, { match: 'id="experience-1-role"' });
  assert.equal(saved.status, 303);
  let row = await read();
  assert.equal(row.experience[1].company, 'Lumen');
  assert.equal(row.experience[1].current, true);

  const page = await testRequest(app.handle, editor());
  const html = await page.text();
  assert.match(html, /Engineer at Lumen/);
  assert.match(html, /id="experience-1-end"[^>]*disabled/);

  const moved = await submitForm(app.handle, editor(), { resumeId: id, section: 'experience', index: '1', direction: 'up' }, { match: /name="index" value="1">\s*<input type="hidden" name="direction" value="up">/ });
  assert.equal(moved.headers.get('location'), `${editor()}#experience-0`);
  row = await read();
  assert.equal(row.experience[0].company, 'Lumen');

  const removed = await submitForm(app.handle, editor(), { resumeId: id, section: 'experience', index: '1' }, { match: /name="index" value="1">\s*<button type="submit"[^>]*aria-label="Remove"/ });
  assert.equal(removed.status, 303);
  row = await read();
  assert.equal(row.experience.length, 1);
});

test('skills and settings save and change the preview template', async () => {
  const skills = await submitForm(app.handle, editor(), { resumeId: id, section: 'skills', index: '0', skills: 'Go, Rust' }, { match: 'id="skills"' });
  assert.equal(skills.status, 303);

  const noName = await submitForm(app.handle, editor(), { resumeId: id, section: 'settings', index: '0', title: '', template: 'minimal', accent: '#0f766e' }, { match: 'id="title"' });
  assert.equal(noName.status, 422);
  assert.match(await noName.text(), /The resume needs a name/);

  const settings = await submitForm(app.handle, editor(), { resumeId: id, section: 'settings', index: '0', title: 'Test: editor renamed', template: 'minimal', accent: '#0f766e' }, { match: 'id="title"' });
  assert.equal(settings.status, 303);
  const row = await read();
  assert.deepEqual(row.skills, ['Go', 'Rust']);
  assert.equal(row.template, 'minimal');
  const page = await testRequest(app.handle, editor());
  const html = await page.text();
  assert.match(html, /Test: editor renamed/);
  assert.match(html, /--accent: #0f766e/);
});

test('duplicate from the editor header opens the copy', async () => {
  const copy = await submitForm(app.handle, editor(), { resumeId: id }, { match: 'Duplicate' });
  assert.equal(copy.status, 303);
  const copyId = (copy.headers.get('location') ?? '').split('/').pop() ?? '';
  assert.notEqual(copyId, id);
  const fd = new FormData();
  fd.set('resumeId', copyId);
  await invokeActionForTest(app, 'modules/resumes/actions/delete-resume.server.ts', 'deleteResume', [fd]);
});
