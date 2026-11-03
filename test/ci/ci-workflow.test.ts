// GitHub Actions runs one job per entry of the webjs.ci list, naming each by
// title. A step added to the list without a matrix entry would never run at all,
// and nothing would go red, so this holds the two together.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface CiStep {
  title: string;
  steps?: CiStep[];
}

const ROOT = join(import.meta.dirname, '..', '..');
// Every job migrates the database itself, ahead of its check.
const NOT_A_JOB = ['Setup'];

function leafTitles(steps: CiStep[]): string[] {
  return steps.flatMap((step) => (step.steps ? leafTitles(step.steps) : [step.title]));
}

function matrixChecks(workflow: string): string[] {
  const block = workflow.match(/^ +check:\n((?: +- '.+'\n)+)/m);
  assert.ok(block, 'the workflow declares a matrix of checks');
  return [...block[1].matchAll(/- '(.+)'/g)].map((entry) => entry[1]);
}

test('the workflow runs every check in the webjs.ci list, and nothing else', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const workflow = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');

  const listed = leafTitles(pkg.webjs.ci.steps).filter((title) => !NOT_A_JOB.includes(title));
  assert.deepEqual(matrixChecks(workflow).sort(), listed.sort());
});
