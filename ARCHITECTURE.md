# Architecture

Read this before changing the code, and `PRODUCT-PRINCIPLES.md` for what the app is for. The framework's own rules are in `.agents/skills/webjs/SKILL.md`.

Folio is one WebJs process and one SQLite file. Pages render to HTML on the server and never hydrate, and JavaScript runs only where a page has to respond while someone types.

## The design

The design is drawn and explained on two pages of the app, and they are the source of truth for it. This file does not repeat them.

- **`/architecture`, the high level:** the shape, routes, how a write works, the sheet, where data lives, and what is left out. Source: `app/(app)/architecture/page.ts`.
- **`/architecture/internals`, the low level:** autosave, forms, actions, scaling, print, samples, the theme, what reaches the browser, and how it is verified. Source: `app/(app)/architecture/internals/page.ts`.

Read the source when the app is not running. If a page and the code disagree, the code is right and the page is a bug, so fix it on the same PR. The deployment is in `README.md` and `compose.pilots.yaml`.

## The rules that hold it together

**Every write is an action.** Each is a `'use server'` function in `modules/resumes/actions/` that takes `FormData`, one per file, so a form post and an RPC call arrive in the same shape.

**Every form works with JavaScript off.** `modules/resumes/components/draft-form.ts` adds autosave by calling the same action. Do not build a write that only works from script.

**One sheet, everywhere.** The preview, the print page, and every thumbnail call `modules/resumes/utils/ui/resume-sheet.ts`, so they cannot drift apart.

**Interactivity lives in islands.** Pages and layouts never hydrate, so a new interaction is a `WebComponent`, not script on a page.

**Server-only code stays in `*.server.ts` files.** A page or component never imports `modules/resumes/utils/store.server.ts` directly.

**Colours are tokens,** written once with `light-dark()` in `app/layout.ts`. The resume sheet stays white in both themes.

**One file opens the database.** That is `db/connection.server.ts`. A resume is edited and rendered as a whole, so its sections are JSON columns on one row in `db/schema.server.ts`.

## What enforces this

A rule only a person remembers is not a rule, so most of these are checked.

| Rule | Enforced by |
| --- | --- |
| Framework conventions and project health | `webjs check` and `webjs doctor`, required checks in `.github/workflows/ci.yml` |
| Server-only code stays out of the browser | `.claude/hooks/check-server-imports.sh` and `webjs check` |
| Islands extend `WebComponent` | `.claude/hooks/block-raw-htmlelement.sh` |
| No commits on `main` | `.hooks/pre-commit`, set up by `bun install` |
| One task, one worktree, primary checkout untouched | `.claude/hooks/require-worktree-for-edits.sh` |
| Tests and docs ship with the code | `.claude/hooks/require-tests-with-src.sh` and `.claude/hooks/require-docs-with-src.sh` warn, and the required checks are the gate |
| Green CI before a merge | Branch protection on `main`, and `.claude/hooks/block-admin-merge.sh` |
| One A4 page per template, no sideways scroll on a phone, no script errors | `test/resumes/e2e/resume-flow.test.ts` |
| The architecture pages cite real files | `test/architecture/architecture.test.ts` |
| The paths cited here exist | `test/agents/docs.test.ts` |
| The CI matrix runs every check in `webjs.ci` | `test/ci/ci-workflow.test.ts` |

Branch protection is a setting on GitHub rather than a file here, so it cannot be read from a diff.
