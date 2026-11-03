# Architecture

How Folio holds together, for anyone about to change it. Read this before the code, and `PRODUCT-PRINCIPLES.md` for what it is for. The framework's own rules are in `.agents/skills/webjs/SKILL.md`.

If this document and the code disagree, the code is right and this document is a bug: fix it on the same PR. `test/agents/docs.test.ts` fails when a path cited here no longer exists. The running app draws the same design at `/architecture` and walks through each mechanism at `/architecture/internals`.

## The shape

One WebJs process and one SQLite file. Folio turns details typed into forms into a printable A4 resume. Pages render to HTML on the server and never hydrate, and JavaScript runs only where a page has to respond while someone types.

## Where things live

| Path | Holds |
| --- | --- |
| `app/` | Routing only: pages, layouts, and one route handler. No logic. |
| `modules/resumes/` | The resume feature: types, queries, actions, islands, templates, utilities. |
| `modules/architecture/` | The parts and figures of the architecture pages. |
| `components/` | The two shared islands and the copied UI kit. |
| `db/` | Schema, the connection, the seed, and migrations. |
| `lib/utils/` | Small shared helpers. |
| `test/` | Server, browser, and e2e tests, by feature. |

## Routes

Two route groups share `app/layout.ts`. `app/(app)/layout.ts` adds the fixed navbar, and `app/(print)/` leaves it out so a sheet prints with nothing around it.

| Route | What it is |
| --- | --- |
| `/` | Home |
| `/resumes` | The list, with search and sort |
| `/resumes/new` | Create a resume |
| `/resumes/[id]` | The editor, with one form per section and a live preview |
| `/resumes/[id]/delete` | Confirm a delete |
| `/resumes/[id]/preview` | The bare sheet, for printing |
| `/resumes/[id]/export` | The resume as JSON |
| `/templates` | The three templates |
| `/architecture`, `/architecture/internals` | How it is built |

## The rules that hold it together

**Every write is an action.** There are eleven, one per file, in `modules/resumes/actions/`. Each is a `'use server'` function that takes `FormData`, so a form post and an RPC call arrive in the same shape. Reads are the two queries in `modules/resumes/queries/`. Input is bounded in one place, `modules/resumes/utils/parse-section.ts`.

**Every form works with JavaScript off.** The form posts to its page. Success answers 303 and a failed check answers 422, rendering the page again with what was typed. With JavaScript on, `modules/resumes/components/draft-form.ts` wraps the same form, mirrors each keystroke into the preview, and calls the same action 700 ms after the last input. Do not build a write that only works from script.

**One sheet, everywhere.** The editor preview, the print page, and every thumbnail call `modules/resumes/utils/ui/resume-sheet.ts`, so they cannot drift apart. A new template goes in `modules/resumes/utils/ui/templates/`, and it has to print to one A4 page for a short resume.

**Interactivity lives in islands.** There are five: `components/fit-sheet.ts`, `components/theme-toggle.ts`, `modules/resumes/components/draft-form.ts`, `modules/resumes/components/print-button.ts`, and `modules/resumes/components/resume-preview.ts`. Pages and layouts never hydrate, so a new interaction is a `WebComponent` in a file like these, not script on a page. The browser downloads only the islands a page uses, and `bunx webjs elision` shows why.

**Server-only code stays in `*.server.ts` files.** Database access and anything else the browser must not receive go there, and a page or component never imports `modules/resumes/utils/store.server.ts` directly.

**Colours are tokens.** They are CSS custom properties written once with `light-dark()` in `app/layout.ts`, and used as utilities like `bg-card`. The resume sheet stays white in both themes, because it is a page of paper.

## Data

One table, in `db/schema.server.ts`. A resume is always edited and rendered as a whole, so its sections are JSON columns on its row, and every write replaces one section. `db/connection.server.ts` is the only file that opens the driver: `bun:sqlite` on Bun and `node:sqlite` on Node, with no native dependencies. Migrations in `db/migrations/` apply when the server starts.

The theme choice is the only thing kept in the browser. Everything a person writes goes to the database.

## Deployment

`compose.pilots.yaml` describes one service on Pilots, with SQLite on a volume so resumes survive a deploy. A volume-backed service runs exactly one replica.

- A merge to `main` deploys to production.
- A pull request gets its own preview, with no volume and an empty database, destroyed when the pull request closes.
- `Dockerfile` installs production dependencies only. Whatever the boot runs has to be one.

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
| The `/architecture` pages cite real files | `test/architecture/architecture.test.ts` |
| The CI matrix runs every check in `webjs.ci` | `test/ci/ci-workflow.test.ts` |

Branch protection is a setting on GitHub rather than a file here, so it cannot be read from a diff.
