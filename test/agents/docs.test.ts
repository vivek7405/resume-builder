// An agent reads these documents before the code and trusts what they say, so a
// path that moved would send it to the wrong place. This holds them to the repo,
// the way test/architecture/architecture.test.ts holds the pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const DOCS = ['ARCHITECTURE.md', 'PRODUCT-PRINCIPLES.md'];

// A code span that names a repo path: it has a slash or a file extension, and is
// not a route, a placeholder, a glob, or a package specifier.
function citedPaths(markdown: string): string[] {
  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]);
  return spans.filter(
    (span) => !span.startsWith('/') && !/[\s<>:'"*]/.test(span) && (span.includes('/') || /\.(md|ts|json|ya?ml)$/.test(span)),
  );
}

for (const doc of DOCS) {
  test(`${doc} cites only files that exist`, () => {
    const cited = citedPaths(readFileSync(join(ROOT, doc), 'utf8'));
    assert.deepEqual(cited.filter((path) => !existsSync(join(ROOT, path))), []);
  });
}

test('the path finder picks up paths and ignores everything else', () => {
  const found = citedPaths('`db/schema.server.ts` `AGENTS.md` `/resumes/[id]` `bun:sqlite` `FormData` `webjs check` `<slug>/x` `*.server.ts`');
  assert.deepEqual(found, ['db/schema.server.ts', 'AGENTS.md']);
});

test('ARCHITECTURE.md cites real paths at all, so the check above cannot pass empty', () => {
  assert.ok(citedPaths(readFileSync(join(ROOT, 'ARCHITECTURE.md'), 'utf8')).length > 20);
});

test('AGENTS.md tells an agent to read both before building', () => {
  const agents = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8');
  const gather = agents.slice(agents.indexOf('## Gather context'), agents.indexOf('## Build a full-stack app'));
  for (const doc of DOCS) assert.ok(gather.includes(doc), `${doc} is in "Gather context"`);
});
