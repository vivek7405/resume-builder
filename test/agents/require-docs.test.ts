// The doc nudge decides from the staged diff, so each case stages real files in
// a throwaway repo and reads what the hook says about the commit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const HOOK = join(import.meta.dirname, '..', '..', '.claude/hooks/require-docs-with-src.sh');
const COMMIT = JSON.stringify({ tool_input: { command: 'git commit -m "Change a thing"' } });

function runWithStaged(files: string[], input = COMMIT, env: NodeJS.ProcessEnv = {}): { status: number | null; stdout: string } {
  const repo = mkdtempSync(join(tmpdir(), 'require-docs-'));
  try {
    spawnSync('git', ['init', '-q'], { cwd: repo });
    for (const file of files) {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      writeFileSync(join(repo, file), 'x\n');
    }
    if (files.length) spawnSync('git', ['add', '.'], { cwd: repo });
    const run = spawnSync('bash', [HOOK], { cwd: repo, input, encoding: 'utf8', env: { ...process.env, ...env } });
    return { status: run.status, stdout: run.stdout };
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

for (const file of ['.github/workflows/ci.yml', 'package.json', 'db/schema.server.ts', 'compose.pilots.yaml', '.claude/skills/start-work/SKILL.md']) {
  test(`warns when ${file} is staged with no doc`, () => {
    const { status, stdout } = runWithStaged([file]);
    assert.equal(status, 0, 'it warns and never blocks');
    const context = JSON.parse(stdout).hookSpecificOutput.additionalContext;
    assert.ok(context.includes(file), 'it names the file');
    assert.match(context, /doc-sync/);
  });
}

for (const doc of ['README.md', 'AGENTS.md', '.agents/rules/workflow.md', 'app/(app)/architecture/internals/page.ts']) {
  test(`stays quiet when ${doc} is staged alongside`, () => {
    assert.deepEqual(runWithStaged(['package.json', doc]), { status: 0, stdout: '' });
  });
}

test('stays quiet on a change the docs do not describe', () => {
  assert.deepEqual(runWithStaged(['modules/resumes/format.ts']), { status: 0, stdout: '' });
});

test('stays quiet on a command that is not a commit', () => {
  const input = JSON.stringify({ tool_input: { command: 'git status' } });
  assert.deepEqual(runWithStaged(['package.json'], input), { status: 0, stdout: '' });
});

test('WEBJS_NO_DOC_GATE silences it', () => {
  assert.deepEqual(runWithStaged(['package.json'], COMMIT, { WEBJS_NO_DOC_GATE: '1' }), { status: 0, stdout: '' });
});
