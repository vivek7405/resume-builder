// The hooks that make the workflow hold on any clone: the two PreToolUse guards,
// the script that installs the git hook, and the skills every agent can reach.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const WORKTREE_GATE = join(ROOT, '.claude/hooks/require-worktree-for-edits.sh');
const ADMIN_GATE = join(ROOT, '.claude/hooks/block-admin-merge.sh');

// A git variable inherited from a calling hook would override `git -C`.
function cleanEnv(extra: Record<string, string> = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
  delete env.WEBJS_NO_WORKTREE_GATE;
  delete env.WEBJS_ALLOW_ADMIN_MERGE;
  return { ...env, ...extra };
}

function hook(path: string, input: object, extra: Record<string, string> = {}) {
  const run = spawnSync('bash', [path], { input: JSON.stringify(input), encoding: 'utf8', env: cleanEnv(extra) });
  return { status: run.status, stderr: run.stderr };
}

function git(cwd: string, ...args: string[]) {
  const run = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-C', cwd, ...args], {
    encoding: 'utf8',
    env: cleanEnv(),
  });
  assert.equal(run.status, 0, run.stderr);
}

// A primary checkout with tracked files at its root and in a subdirectory, plus a
// linked worktree of it.
function repoWithWorktree(t: { after: (fn: () => void) => void }) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), 'gates-')));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const primary = join(base, 'primary');
  const linked = join(base, 'linked');
  mkdirSync(join(primary, 'src/deep'), { recursive: true });
  git(primary, 'init', '-q', '-b', 'main');
  writeFileSync(join(primary, 'root.ts'), '1');
  writeFileSync(join(primary, 'src/deep/file.ts'), '1');
  git(primary, 'add', '-A');
  git(primary, 'commit', '-q', '-m', 'init');
  git(primary, 'worktree', 'add', '-q', '-b', 'task', linked);
  return { primary, linked };
}

const edit = (path: string) => ({ tool_input: { file_path: path } });

test('an edit to a tracked file in the primary checkout is blocked', (t) => {
  const { primary } = repoWithWorktree(t);
  const result = hook(WORKTREE_GATE, edit(join(primary, 'root.ts')));
  assert.equal(result.status, 2);
  assert.match(result.stderr, /primary checkout/);
});

test('a subdirectory of the primary checkout is blocked too', (t) => {
  // From a subdirectory git prints the common dir as relative, which once made
  // this gate fail open for the whole source tree.
  const { primary } = repoWithWorktree(t);
  assert.equal(hook(WORKTREE_GATE, edit(join(primary, 'src/deep/file.ts'))).status, 2);
});

test('a notebook path counts as an edit', (t) => {
  const { primary } = repoWithWorktree(t);
  assert.equal(hook(WORKTREE_GATE, { tool_input: { notebook_path: join(primary, 'root.ts') } }).status, 2);
});

test('the same files in a linked worktree are allowed', (t) => {
  const { linked } = repoWithWorktree(t);
  assert.equal(hook(WORKTREE_GATE, edit(join(linked, 'root.ts'))).status, 0);
  assert.equal(hook(WORKTREE_GATE, edit(join(linked, 'src/deep/file.ts'))).status, 0);
});

test('an untracked file in the primary checkout is allowed', (t) => {
  const { primary } = repoWithWorktree(t);
  assert.equal(hook(WORKTREE_GATE, edit(join(primary, 'scratch.txt'))).status, 0);
});

test('a path outside any repo, or a call with no path, is allowed', () => {
  assert.equal(hook(WORKTREE_GATE, edit(join(tmpdir(), 'nowhere/file.ts'))).status, 0);
  assert.equal(hook(WORKTREE_GATE, { tool_input: {} }).status, 0);
});

test('the worktree gate has its escape hatch', (t) => {
  const { primary } = repoWithWorktree(t);
  const input = edit(join(primary, 'root.ts'));
  assert.equal(hook(WORKTREE_GATE, input, { WEBJS_NO_WORKTREE_GATE: '1' }).status, 0);
});

const command = (text: string) => ({ tool_input: { command: text } });

for (const blocked of [
  'gh pr merge 12 --admin',
  'gh pr merge --admin 12',
  'GH_TOKEN=x gh pr merge 12 --merge --admin',
  'git fetch && gh pr merge 12 --admin',
]) {
  test(`blocks "${blocked}"`, () => {
    const result = hook(ADMIN_GATE, command(blocked));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /--admin/);
  });
}

for (const allowed of [
  'gh pr merge 12 --merge --match-head-commit abc',
  'git commit -m "explain why gh pr merge --admin is banned"',
  'grep -n "gh pr merge --admin" .claude/hooks/block-admin-merge.sh',
  'gh pr view 12',
]) {
  test(`allows "${allowed}"`, () => {
    assert.equal(hook(ADMIN_GATE, command(allowed)).status, 0);
  });
}

test('the admin gate has its escape hatch', () => {
  assert.equal(hook(ADMIN_GATE, command('gh pr merge 12 --admin'), { WEBJS_ALLOW_ADMIN_MERGE: '1' }).status, 0);
});

test('settings.json wires both guards to the right tools, and they are executable', () => {
  const settings = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'));
  const wired = (name: string) =>
    settings.hooks.PreToolUse.find((entry: { hooks: { command: string }[] }) =>
      entry.hooks.some((item) => item.command === `.claude/hooks/${name}`),
    )?.matcher;
  assert.match(wired('require-worktree-for-edits.sh'), /Edit/);
  assert.match(wired('require-worktree-for-edits.sh'), /Write/);
  assert.equal(wired('block-admin-merge.sh'), 'Bash');
});

test('installing dependencies sets up the git hook, and can never fail the install', () => {
  const { prepare } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
  assert.match(prepare, /git config core\.hooksPath \.hooks/);
  assert.match(prepare, /\|\| true$/);
  assert.ok(existsSync(join(ROOT, '.hooks/pre-commit')));

  // Run for real where there is no repo, as in the Docker build.
  const empty = mkdtempSync(join(tmpdir(), 'prepare-'));
  const run = spawnSync('sh', ['-c', prepare], { cwd: empty, env: cleanEnv() });
  rmSync(empty, { recursive: true, force: true });
  assert.equal(run.status, 0);
});

test('every repo skill resolves through .agents/skills, for agents that read there', () => {
  const skills = readdirSync(join(ROOT, '.claude/skills'));
  assert.ok(skills.length > 0);
  for (const skill of skills) {
    const linked = join(ROOT, '.agents/skills', skill);
    assert.ok(existsSync(join(linked, 'SKILL.md')), `${skill} is reachable at .agents/skills`);
    assert.equal(realpathSync(linked), realpathSync(join(ROOT, '.claude/skills', skill)));
  }
});
