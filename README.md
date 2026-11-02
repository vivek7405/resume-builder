# Folio

A minimalistic resume builder. Fill in your details, pick one of three templates, and print a clean A4 PDF. Several resumes, one per kind of role. No accounts, no clutter.

Built on [WebJs](https://webjs.dev): server-rendered pages, small web-component islands, SQLite through Drizzle, Tailwind, no build step.

## What it does

- **Resumes list** with search and sort, each card a scaled thumbnail of the sheet.
- **Editor** with one form per section (profile, experience, education, projects, skills, settings). Every form works with JavaScript off. With it on, each keystroke updates the live preview and the section autosaves.
- **Three templates** (Classic, Modern, Minimal) rendered from one document, switchable at any time, with a six-colour accent.
- **Print view** on a real A4 sheet with print styles, so the browser's "Save as PDF" produces the document. **Export JSON** for a backup.
- **Generate a sample resume**: one click gives you a complete, fictional resume to judge the output. With a Claude credential configured, Claude writes it from a one-line brief. Without one, a built-in sample is used.

## Run it

```sh
bun install
bun run db:generate && bun run db:migrate   # create the SQLite schema
bun run db:seed                              # two sample resumes
bun --bun run dev                            # http://localhost:8080
```

`PORT=8090 bun --bun run dev` picks another port.

### AI samples (optional)

Copy `.env.example` to `.env` and set one of:

```
ANTHROPIC_API_KEY=...        # an API key
ANTHROPIC_AUTH_TOKEN=...     # a Claude subscription bearer token
```

The app reads either through the official SDK's default credential chain and calls `claude-opus-5-5` with a structured output schema. `FOLIO_AI=off` forces the built-in sample. `.env` is git-ignored. Never commit a key.

## Verify

```sh
bun run ci                   # check, doctor, typecheck, audit, server, browser and e2e tests
bun run ci -- --only Tests   # one layer while iterating
```

The e2e layer needs a Chromium: `bunx playwright install chromium`, then `CHROMIUM_PATH=$(node -e "console.log(require('playwright-core').chromium.executablePath())")` as the workflow does.

## Layout

```
app/(app)/            pages with the navbar: home, resumes, new, editor, delete, templates
app/(print)/          the bare print view and the JSON export route
modules/resumes/      types, draft signal, queries, actions, islands, templates, pure utils
components/           theme toggle, fit-sheet (scales an A4 sheet), form-pending, the ui kit copies
db/                   schema, connection, seed, migrations
lib/ai/               the Claude client behind the sample generator (server only)
test/                 server, browser and e2e tests per feature
```

The conventions, build order and framework rules live in `AGENTS.md` and `.agents/skills/webjs/`.
