---
name: doc-sync
description: Keep resume-builder's documentation surfaces in sync with the code. Use when a change alters documented behaviour, a route, the data model, the workflow, CI, or the deployment, or when the user asks about doc drift, doc gaps, "did we update the docs", or syncing the docs, while working in this repo. Replaces webjs-doc-sync here, which maps the webjs framework's doc surfaces.
when_to_use: |
  Examples that should trigger this skill:
    "sync the docs for the new export route"
    "did we update the docs for this?"
    "find the doc gaps from recent work"
    finishing any change whose documented surface moved
  Do NOT trigger for: a purely internal change with no documented surface. Record that no surface applies and move on.
---

# Keep resume-builder's docs in sync

Documentation lands on the same PR as the code. The usual failure is updating one surface and leaving the others describing the old behaviour, so check them all.

## The surfaces

For any change, decide per surface whether it applies, then update it or write "N/A because <reason>" in the PR body. The list is a starting point. `git ls-files '*.md'` is the source of truth for markdown.

1. **`README.md`**: setup, verify, and deploy.
2. **`AGENTS.md`**: the build playbook and the commands. It is the first thing an agent reads.
3. **`.agents/rules/workflow.md`**: git, tests, CI, and merge rules.
4. **`CONVENTIONS.md`**: only says where each rule lives, so it changes when a rule moves.
5. **`app/(app)/architecture/page.ts` and `app/(app)/architecture/internals/page.ts`**: the published description of how the app works. These rot when code moves, and `test/architecture/architecture.test.ts` fails on a cited file that no longer exists.
6. **`.github/pull_request_template.md`** and the header of **`.github/workflows/ci.yml`**: the PR gate and how CI is run.
7. **`.hooks/pre-commit`** and **`.claude/`** (`settings.json`, `hooks/`, `skills/`, `gh-ids.env`): comments and skills that restate a workflow rule.
8. **`compose.pilots.yaml`** and **`.env.example`**: the deployed shape and the configuration.

`.agents/skills/webjs/` is the framework's own reference. It describes WebJs, not this app, so do not edit it for an app change. If this repo deliberately departs from it, say so in `workflow.md`.

Settings that live outside the repo need recording here too: the required checks on `main` and the pilots service configuration are not in any diff.

## Change type to surface

| Change | Check |
| --- | --- |
| New or changed route, or user-visible behaviour | README if headline, architecture pages |
| Data model (`db/schema.server.ts`) | architecture pages, `.env.example` if configuration moved |
| A check added or renamed in `webjs.ci` | `ci.yml` matrix, required checks on `main`, `workflow.md`, `AGENTS.md`, README, architecture internals |
| Workflow or git rule | `workflow.md`, `AGENTS.md`, `CONVENTIONS.md`, the skills, the PR template, `.hooks/pre-commit` |
| A new skill or hook | `AGENTS.md`, `.claude/settings.json`, the router in `.claude/hooks/route-skills.sh` |
| Deployment or a new env var | README Deploy, `compose.pilots.yaml`, `.env.example` |
| Behaviour change to anything already documented | every surface the grep below finds |
| Purely internal (refactor, test stabilization) | none, recorded as such |

## Per-change sync

1. Pick the change's identifying tokens: a route, a file name, a command, a config key, a feature phrase.
2. Grep them across the surfaces.

   ```sh
   git grep -n -iE '<token1>|<token2>' -- \
     README.md AGENTS.md CONVENTIONS.md .agents/rules .github .hooks .claude \
     'app/(app)/architecture' compose.pilots.yaml .env.example
   ```

3. Update each surface that applies. For a behaviour change, correct every place that describes the old behaviour.
4. Re-run the grep and confirm no surface still tells the old story.
5. Keep to the prose rule in `.agents/rules/workflow.md`. A changed page under `app/` is covered by the architecture test when its PR runs.

## Audit mode

Use this to sweep shipped work for drift.

1. List candidates: merged PRs that changed a user-facing or documented surface. Skip purely internal ones.
2. For each one, read what it introduced, take its tokens, and run the grep.
3. A surface is a gap when the table says it applies and the grep finds the feature absent or stale.
4. For each confirmed gap in a bulk audit, file an issue with `file-issue`, naming the exact file and the source of truth. For a single small gap in a file a PR already touches, fold the fix into that PR.

Surface reads fan out well: one read-only `Explore` agent per surface in a single message, reporting back. Edits stay in the main session, because parallel writers on overlapping docs collide.
