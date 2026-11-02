// The MPA pages through the real request pipeline: list, search, create
// (303 on success, 422 with the field error on failure), templates, delete.
process.env.DATABASE_URL ||= 'file:./db/dev.db';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler, invokeActionForTest } from '@webjsdev/server';
import { testRequest, submitForm } from '@webjsdev/server/testing';

let app: Awaited<ReturnType<typeof createRequestHandler>>;
const created: string[] = [];

before(async () => {
  app = await createRequestHandler({ appDir: process.cwd(), dev: true });
});
after(async () => {
  for (const id of created) {
    const fd = new FormData();
    fd.set('resumeId', id);
    await invokeActionForTest(app, 'modules/resumes/actions/delete-resume.server.ts', 'deleteResume', [fd]);
  }
});

test('the home page renders the hero, the sample thumbnail and the sample form', async () => {
  const res = await testRequest(app.handle, '/');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /Resumes, .*beautifully/s);
  assert.match(body, /<fit-sheet/);
  assert.match(body, /Generate a sample resume/);
  assert.match(body, /<header data-app-header/);
});

test('/resumes/new creates a resume with JavaScript off and refuses an empty name', async () => {
  const page = await testRequest(app.handle, '/resumes/new');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Resume name/);

  const bad = await submitForm(app.handle, '/resumes/new', { title: '', template: 'modern' }, { match: 'name="title"' });
  assert.equal(bad.status, 422);
  assert.match(await bad.text(), /Give the resume a name/);

  const ok = await submitForm(app.handle, '/resumes/new', { title: 'Test: page created', template: 'minimal' }, { match: 'name="title"' });
  assert.equal(ok.status, 303);
  const location = ok.headers.get('location') ?? '';
  assert.match(location, /^\/resumes\/[0-9a-f-]{36}$/);
  created.push(location.split('/').pop() ?? '');
});

test('/resumes lists, searches, sorts and shows an empty state', async () => {
  const list = await testRequest(app.handle, '/resumes');
  assert.equal(list.status, 200);
  const body = await list.text();
  assert.match(body, /Test: page created/);
  assert.match(body, /Minimal/);

  const hit = await testRequest(app.handle, '/resumes?q=page+created&sort=title');
  assert.match(await hit.text(), /Test: page created/);

  const miss = await testRequest(app.handle, '/resumes?q=no-such-thing-at-all');
  const missBody = await miss.text();
  assert.match(missBody, /Nothing matches/);
  assert.match(missBody, /role="status"/);
});

test('/templates starts a resume in the chosen template', async () => {
  const page = await testRequest(app.handle, '/templates');
  assert.equal(page.status, 200);
  const body = await page.text();
  for (const name of ['Classic', 'Modern', 'Minimal']) assert.match(body, new RegExp(`Start with ${name}`));

  const started = await submitForm(app.handle, '/templates', { title: 'Test: from templates', template: 'modern' }, { match: 'value="modern"' });
  assert.equal(started.status, 303);
  const id = (started.headers.get('location') ?? '').split('/').pop() ?? '';
  created.push(id);
  const exported = await testRequest(app.handle, `/resumes/${id}/export`);
  assert.equal(((await exported.json()) as { template: string }).template, 'modern');
});

test('the delete page confirms, then the resume is gone', async () => {
  const made = await submitForm(app.handle, '/resumes/new', { title: 'Test: to delete' }, { match: 'name="title"' });
  const id = (made.headers.get('location') ?? '').split('/').pop() ?? '';
  const page = await testRequest(app.handle, `/resumes/${id}/delete`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Test: to delete/);

  const gone = await submitForm(app.handle, `/resumes/${id}/delete`, { resumeId: id });
  assert.equal(gone.status, 303);
  assert.equal(gone.headers.get('location'), '/resumes');
  const after404 = await testRequest(app.handle, `/resumes/${id}/delete`);
  assert.equal(after404.status, 404);
  assert.match(await after404.text(), /That page is not here/);
});
