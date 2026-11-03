// GitHub does not require resolved conversations on main, so this skill is the
// only thing that makes an agent close out review threads before it merges. A
// merge once went through with threads open, on the instruction not to fix them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SKILL = readFileSync(join(import.meta.dirname, '..', '..', '.claude/skills/start-work/SKILL.md'), 'utf8');

function section(title: string, next: string): string {
  const start = SKILL.indexOf(`## ${title}`);
  const end = SKILL.indexOf(`## ${next}`);
  assert.ok(start >= 0 && end > start, `the skill has "${title}" before "${next}"`);
  return SKILL.slice(start, end);
}

test('threads are listed, replied to, and resolved before the merge command', () => {
  const merging = section('Merging', 'After a merge');
  const merge = merging.indexOf('gh pr merge');
  for (const step of ['reviewThreads', '/replies', 'resolveReviewThread']) {
    const at = merging.indexOf(step);
    assert.ok(at >= 0, `the Merging section has ${step}`);
    assert.ok(at < merge, `${step} comes before gh pr merge`);
  }
});

test('a finding the owner declined is resolved, and only an undecided one holds the merge', () => {
  assert.match(section('Merging', 'After a merge'), /owner said not to fix it/);
  const review = section('Review', 'Merging');
  assert.match(review, /decided not to fix it/);
  assert.doesNotMatch(review, /won't-fix thread open/);
});
