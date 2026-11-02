// The three templates render every section from the sample data, and the
// print page and the export route serve a real resume (and 404 a missing one).
process.env.FOLIO_AI = 'off';
process.env.DATABASE_URL ||= 'file:./db/dev.db';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { renderToString } from '@webjsdev/core/server';
import { createRequestHandler, invokeActionForTest } from '@webjsdev/server';
import { testRequest } from '@webjsdev/server/testing';
import type { ActionResult } from '@webjsdev/server';
import { resumeDocument } from '#modules/resumes/utils/ui/resume-document.ts';
import { SAMPLE_RESUMES } from '#modules/resumes/utils/sample-data.ts';
import { emptyDocument, TEMPLATES, type ResumeData } from '#modules/resumes/types.ts';

const sample = SAMPLE_RESUMES[0].document;

for (const t of TEMPLATES) {
  test(`${t.name} template renders name, roles, highlights, education, projects and skills`, async () => {
    const out = await renderToString(resumeDocument({ ...sample, template: t.id }));
    assert.match(out, /Maya Okafor/);
    assert.match(out, /Senior Backend Engineer/);
    assert.match(out, /Lumen Pay/);
    assert.match(out, /Mar 2021 – Present/);
    assert.match(out, /Designed the double-entry ledger service/);
    assert.match(out, /University of Edinburgh/);
    assert.match(out, /ledgerkit/);
    assert.match(out, /Kubernetes/);
    assert.match(out, /--accent: #3b4fd9/);
    assert.match(out, /class="resume-sheet/);
  });
}

test('an empty document shows a name placeholder and no empty sections', async () => {
  const out = await renderToString(resumeDocument(emptyDocument('minimal')));
  assert.match(out, /Your name/);
  assert.doesNotMatch(out, /Experience/);
  assert.doesNotMatch(out, /Skills/);
});

let app: Awaited<ReturnType<typeof createRequestHandler>>;
let id = '';
before(async () => {
  app = await createRequestHandler({ appDir: process.cwd(), dev: true });
  const fd = new FormData();
  fd.set('template', 'modern');
  const made = await invokeActionForTest<ActionResult<ResumeData>>(app, 'modules/resumes/actions/generate-sample.server.ts', 'generateSample', [fd]);
  if (made.success && made.data) id = made.data.id;
});
after(async () => {
  const fd = new FormData();
  fd.set('resumeId', id);
  await invokeActionForTest(app, 'modules/resumes/actions/delete-resume.server.ts', 'deleteResume', [fd]);
});

test('the preview page renders the sheet without the app navbar', async () => {
  const res = await testRequest(app.handle, `/resumes/${id}/preview`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /resume-sheet/);
  assert.match(body, /print-button/);
  assert.doesNotMatch(body, /<header data-app-header/);
});

test('the export route downloads JSON and 404s a missing id', async () => {
  const res = await testRequest(app.handle, `/resumes/${id}/export`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/json/);
  assert.match(res.headers.get('content-disposition') ?? '', /attachment/);
  const json = await res.json() as { profile: { fullName: string }; template: string };
  assert.equal(json.template, 'modern');
  assert.ok(json.profile.fullName);
  const missing = await testRequest(app.handle, '/resumes/does-not-exist/export');
  assert.equal(missing.status, 404);
  const missingPage = await testRequest(app.handle, '/resumes/does-not-exist/preview');
  assert.equal(missingPage.status, 404);
});
