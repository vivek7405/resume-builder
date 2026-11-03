# Folio

A minimalistic resume builder. Fill in your details, pick one of three templates, and print a clean A4 PDF. Several resumes, one per kind of role. No accounts, no clutter.

Built on [WebJs](https://webjs.dev): server-rendered pages, small web-component islands, SQLite through Drizzle, Tailwind, no build step.

## What it does

- **Resumes list** with search and sort, each card a scaled thumbnail of the sheet.
- **Editor** with one form per section (profile, experience, education, projects, skills, settings). Every form works with JavaScript off. With it on, each keystroke updates the live preview and the section autosaves.
- **Three templates** (Classic, Modern, Minimal) rendered from one document, switchable at any time, with a six-colour accent.
- **Print view** on a real A4 sheet with print styles, so the browser's "Save as PDF" produces the document. **Export JSON** for a backup.
- **Generate a sample resume**: one click inserts a complete, fictional resume so you can judge the output before typing a word.

## Run it

```sh
bun install
bun run db:generate && bun run db:migrate   # create the SQLite schema
bun run db:seed                              # three sample resumes
bun --bun run dev                            # http://localhost:8080
```

`PORT=8090 bun --bun run dev` picks another port.

## Verify

[GitHub Actions](.github/workflows/ci.yml) runs every check on each pull request and each push to `main`, one job per check: conventions, health, types, the dependency audit, and the server, browser and e2e tests. `main` requires all of them, so a red check blocks the merge. Nothing has to pass locally before a push.

```sh
gh pr checks                            # the result for this branch's pull request
bun run ci -- --only "Tests: server"    # one check while iterating, by its title in webjs.ci
```

The browser and e2e checks need a Chromium to run locally: `bunx playwright install chromium`, then `CHROMIUM_PATH=$(node -e "console.log(require('playwright-core').chromium.executablePath())")` as the workflow does.

## Deploy

Live at https://resume-builder.pilotrun.app, on [pilots](https://pilots.run). `compose.pilots.yaml` describes the service, with SQLite on a volume so resumes survive a deploy.

- A push to `main` deploys.
- A pull request gets its own preview at `pr-<number>-resume-builder.pilotrun.app`, with its own empty database. The pilots GitHub App posts the link on the pull request and destroys the preview when it closes.
- To deploy by hand, run `pilot deploy` in this directory.

The app has no accounts, so anyone with the address can read, change and delete every resume on it.

## Layout

```
app/(app)/            pages with the navbar: home, resumes, new, editor, delete, templates, architecture
app/(print)/          the bare print view and the JSON export route
modules/resumes/      types, draft signal, queries, actions, islands, templates, pure utils
modules/architecture/ the page parts and hand-drawn figures of the architecture pages
components/           theme toggle, fit-sheet (scales an A4 sheet), the ui kit copies
db/                   schema, connection, seed, migrations
test/                 server, browser and e2e tests per feature
```

How it all works is drawn at `/architecture` and `/architecture/internals` on the running app.

[`ARCHITECTURE.md`](ARCHITECTURE.md) is the same design in writing, and [`PRODUCT-PRINCIPLES.md`](PRODUCT-PRINCIPLES.md) says what the app is for.

The conventions, build order and framework rules live in `AGENTS.md` and `.agents/skills/webjs/`. `bun install` also points git at `.hooks/`, whose pre-commit hook refuses a commit on `main`.
