// The prompt router decides from text, so these hold both of its failure modes:
// a request that no longer reaches its skill, and an ordinary sentence that gets
// routed anyway, which is the false positive this router exists to avoid. The
// standing policy is separate and goes out on every prompt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const ROUTER = join(ROOT, '.claude/hooks/route-skills.sh');
const SKILLS_DIR = join(ROOT, '.claude/skills');
const SKILLS = ['file-issue', 'start-work', 'list-todos', 'plan-issue', 'research-record', 'doc-sync'];
// Routed to, but not in this repo: personal skills, and one built into Claude Code.
const EXTERNAL = ['pr-review', 'pilots', 'run'];

function route(prompt: string): { status: number | null; stdout: string } {
  const run = spawnSync('bash', [ROUTER], { input: JSON.stringify({ prompt }), encoding: 'utf8' });
  return { status: run.status, stdout: run.stdout };
}

function routedSkills(prompt: string): string[] {
  const { status, stdout } = route(prompt);
  assert.equal(status, 0, `the router never blocks a prompt: ${prompt}`);
  if (!stdout) return [];
  const context: string = JSON.parse(stdout).hookSpecificOutput.additionalContext;
  return [...context.matchAll(/^- ([a-z-]+):/gm)].map((match) => match[1]);
}

const ROUTED: [string, string][] = [
  ['File an issue on the board for the export bug', 'file-issue'],
  ['open an issue about the broken preview', 'file-issue'],
  ['open a github issue for this', 'file-issue'],
  ['can you create a new task for this', 'file-issue'],
  ['track this as a todo', 'file-issue'],
  ['make this an issue', 'file-issue'],
  ['work on #12', 'start-work'],
  ['start issue 12', 'start-work'],
  ['pick up #12', 'start-work'],
  ['start work on the rate limit', 'start-work'],
  ["let's work on the export issue", 'start-work'],
  ['plan #12', 'plan-issue'],
  ['plan this issue', 'plan-issue'],
  ['get #12 ready for development', 'plan-issue'],
  ['make those todos implementation-ready', 'plan-issue'],
  ['scope out #12', 'plan-issue'],
  ["what's open?", 'list-todos'],
  ['what should I work on', 'list-todos'],
  ['show me the board', 'list-todos'],
  ['research whether we should move off SQLite', 'research-record'],
  ['write up the design for theming', 'research-record'],
  ['compare puppeteer vs the print dialog', 'research-record'],
  ['spike PDF export', 'research-record'],
  ['find the doc gaps', 'doc-sync'],
  ['did we update the docs for this?', 'doc-sync'],
  ['sync the docs', 'doc-sync'],
  ['review the PR', 'pr-review'],
  ['review #12', 'pr-review'],
  ['do a code review of this', 'pr-review'],
  ['verify the fix', 'run'],
  ['make sure the editor still works', 'run'],
  ['redeploy the service', 'pilots'],
  ['can we roll back', 'pilots'],
];

for (const [prompt, skill] of ROUTED) {
  test(`routes "${prompt}" to ${skill}`, () => {
    assert.deepEqual(routedSkills(prompt), [skill]);
  });
}

const UNROUTED = [
  'the file has an issue with the import',
  'the file that has an issue',
  'why does this file open with an issue banner',
  'start 3 servers',
  'add a task queue to the app',
  'open the issue page and tell me what it says',
  'is the server ready for review',
  'is this ready to merge',
  'start the dev server',
  'the traffic spike on the home page looks odd',
  'what does this function return',
  'Is there a mandatory review required for merging the PR?',
  'the docs folder is large',
  'what is the plan for #12',
  'the plan issue came up again',
  'the code review passed',
  'is the review of this done',
  'it was deployed yesterday',
];

for (const prompt of UNROUTED) {
  test(`routes nothing for "${prompt}"`, () => {
    assert.deepEqual(routedSkills(prompt), []);
  });
}

test('the standing policy goes out on every prompt, routed or not', () => {
  for (const prompt of ['what does this function return', 'file an issue']) {
    const context = JSON.parse(route(prompt).stdout).hookSpecificOutput.additionalContext;
    assert.match(context, /skill policy/);
    assert.match(context, /check the available skills/);
  }
});

test('routed output tells the model the repo skill wins over a webjs one', () => {
  const context = JSON.parse(route('file an issue').stdout).hookSpecificOutput.additionalContext;
  assert.match(context, /take the place of any webjs-\* skill/);
  const unrouted = JSON.parse(route('what does this function return').stdout).hookSpecificOutput.additionalContext;
  assert.doesNotMatch(unrouted, /webjs-\*/);
});

test('the router ignores a payload with no prompt', () => {
  const run = spawnSync('bash', [ROUTER], { input: '{}', encoding: 'utf8' });
  assert.deepEqual([run.status, run.stdout], [0, '']);
});

test('settings.json wires the router on UserPromptSubmit, and it is executable', () => {
  const settings = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'));
  const commands = settings.hooks.UserPromptSubmit.flatMap((entry: { hooks: { command: string }[] }) =>
    entry.hooks.map((hook) => hook.command),
  );
  assert.ok(commands.includes('.claude/hooks/route-skills.sh'));
  assert.ok(statSync(ROUTER).mode & 0o100, 'the hook has its executable bit');
});

test('every skill the router names exists, and every repo skill is routed', () => {
  const named = [...readFileSync(ROUTER, 'utf8').matchAll(/add_match "([a-z-]+):/g)].map((match) => match[1]);
  assert.deepEqual(named.sort(), [...SKILLS, ...EXTERNAL].sort());
  assert.deepEqual(readdirSync(SKILLS_DIR).sort(), [...SKILLS].sort());
});

test('every board status a skill sets has an id in gh-ids.env', () => {
  const ids = readFileSync(join(ROOT, '.claude/gh-ids.env'), 'utf8');
  for (const skill of SKILLS) {
    const source = readFileSync(join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8');
    for (const [, name] of source.matchAll(/"\$(STATUS_[A-Z_]+)"/g)) {
      if (name === 'STATUS_FIELD_ID') continue;
      assert.match(ids, new RegExp(`^${name}=\\S+$`, 'm'), `${skill} uses ${name}`);
    }
  }
});

for (const skill of SKILLS) {
  test(`${skill} names itself and carries nothing from the framework repo`, () => {
    const path = join(SKILLS_DIR, skill, 'SKILL.md');
    assert.ok(existsSync(path), `${skill} has a SKILL.md`);
    const source = readFileSync(path, 'utf8');
    assert.match(source, new RegExp(`^---\\nname: ${skill}\\ndescription: `));
    assert.doesNotMatch(source, /webjsdev\/webjs|orgs\/webjsdev|gh-budget|railway|run-bun-tests/i);
  });
}
