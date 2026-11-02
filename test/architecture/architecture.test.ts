// /architecture and /architecture/internals describe the code, so they rot when
// the code moves. These tests hold what can be held mechanically: the pages
// render with their figures, every file a page cites exists, and every in-page
// link has a target.
process.env.DATABASE_URL ||= 'file:./db/dev.db';

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequestHandler } from '@webjsdev/server';
import { testRequest } from '@webjsdev/server/testing';

const PAGES = ['/architecture', '/architecture/internals'];
const ROOT = join(import.meta.dirname, '..', '..');

let app: Awaited<ReturnType<typeof createRequestHandler>>;
before(async () => {
  app = await createRequestHandler({ appDir: process.cwd(), dev: true });
});

for (const path of PAGES) {
  test(`${path} renders inside the app chrome with its figures`, async () => {
    const res = await testRequest(app.handle, path);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /<header data-app-header/);
    assert.match(body, /<figure/);
    assert.match(body, /id="ar-head"/);
  });

  test(`${path} cites only files that exist`, async () => {
    const body = await (await testRequest(app.handle, path)).text();
    const cited = [...body.matchAll(/<p data-sources[\s\S]*?<\/p>/g)]
      .flatMap((m) => [...m[0].matchAll(/<code[^>]*>([^<]+)/g)].map((c) => c[1]));
    assert.ok(cited.length > 0, `${path} cites its sources`);
    for (const file of cited) assert.ok(existsSync(join(ROOT, file)), `${path} cites ${file}, which does not exist`);
  });

  test(`every in-page link on ${path} has a target`, async () => {
    const body = await (await testRequest(app.handle, path)).text();
    for (const m of body.matchAll(/href="#([^"]+)"/g)) assert.match(body, new RegExp(`id="${m[1]}"`), `#${m[1]} has no target`);
  });
}

test('the home page links the architecture, and the primary nav does not', async () => {
  const body = await (await testRequest(app.handle, '/')).text();
  assert.match(body, /href="\/architecture"/);
  const nav = body.match(/<nav[^>]*aria-label="Primary"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.ok(nav.length > 0, 'the page has a primary nav');
  assert.doesNotMatch(nav, /architecture/);
});
