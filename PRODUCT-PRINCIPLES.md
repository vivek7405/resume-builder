# Product principles

What Folio is for, and how to decide when a request pulls against it. `ARCHITECTURE.md` says how it is built. This says what it should be.

Folio is a minimalistic resume builder. Fill in your details, pick a template, and print a clean A4 PDF.

These are drawn from what the product already does. When a change would break one, say so before building it, because that is the owner's call to make, not an agent's.

## The principles

**1. One job, done well.** Details go in and a clean A4 resume comes out. A feature earns its place by making that output better or getting to it faster. If it needs explaining, or adds a screen most people never open, it is clutter.

**2. The page is the product.** What matters is the sheet someone hands to an employer. A short resume prints to exactly one A4 page in every template, and the page stays white whatever the app's theme is.

**3. What you see is what prints.** The editor preview, the thumbnail, and the printed page are the same sheet. A change never makes them differ, even slightly.

**4. Nothing typed gets lost.** Edits autosave, and a failed check gives back everything that was typed along with the error. Losing someone's words is the worst thing the app can do.

**5. It works without JavaScript.** Every form is a real form, and saving works with script off. Script makes it feel instant. It never makes it possible.

**6. Judge it before typing a word.** One click makes a complete sample resume, so anyone can see the output first. Starting should never need a sign-up or an empty form.

**7. Several resumes, one per kind of role.** People apply for different things, so a resume can be duplicated and tuned, and the template can change at any time without retyping.

**8. Your data stays yours.** It leaves only when you ask, through print or a JSON export. The app calls no outside services and holds no API keys.

**9. Fine on a phone.** No page scrolls sideways at phone width.

## What it leaves out, on purpose

- **Accounts.** It is a personal tool, so every resume is visible to whoever runs it. Anyone hosting it publicly has to put access control in front of it. The live demo has none, so never put anything real in it.
- **Server-side PDF.** The browser's print pipeline does this, which keeps a headless browser and a rendering dependency out of the app.
- **AI.** Samples are fixed, fictional data.
- **A build step.** The source runs as written. Only the Tailwind stylesheet is compiled.

Adding any of these is a change of direction, not a feature, so it needs the owner's decision first.

## How to use this

- **Filing or planning an issue:** name the principle it serves. If it serves none, ask whether it belongs.
- **Building:** when two options both work, pick the one that keeps more of this true.
- **Reviewing:** a change that breaks one of these is a finding, even with every check green.
