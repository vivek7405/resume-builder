/**
 * /architecture
 *
 * How Folio is built: what it is made of, the routes, the two ways a write
 * reaches the database, where data lives and what it leaves out.
 * /architecture/internals is the deep dive. This page answers "what is it made
 * of", that one answers "how does it actually work".
 *
 * Every statement is checkable in the code, and each section names the files
 * to check. test/architecture/architecture.test.ts asserts those paths exist.
 * If this page and the code disagree, the code is right and this page is a bug.
 *
 * A plain page with no password: the repo is public, and nothing here is secret.
 */
import { html } from '@webjsdev/core';
import type { Metadata } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { arrowDefs } from '#modules/architecture/utils/diagram.ts';
import { dataFigure, sheetFigure, systemFigure } from '#modules/architecture/utils/figures.ts';
import { C, cells, contents, hero, LINK, plainly, PROSE, section, sources, table } from '#modules/architecture/utils/page.ts';

export const metadata: Metadata = {
  title: 'Architecture | Folio',
  description: 'How Folio is built: one WebJs process, one SQLite file, five islands, and a resume sheet rendered by one function.',
};

const CONTENTS: [string, string][] = [
  ['shape', 'The shape'],
  ['routes', 'Routes'],
  ['writes', 'Two ways to write'],
  ['sheet', 'One sheet'],
  ['data', 'Where data lives'],
  ['left-out', 'What it leaves out'],
];

const ROUTES: unknown[][] = [
  ['/', 'Landing page, with a rendered sample and recent resumes', 'fit-sheet'],
  ['/resumes', 'List, with search and sort through a GET form', 'fit-sheet'],
  ['/resumes/new', 'Create form, with template choice', 'fit-sheet'],
  ['/resumes/[id]', 'Editor: one form per section beside a live preview', 'draft-form, resume-preview'],
  ['/resumes/[id]/delete', 'Delete confirmation', 'none'],
  ['/resumes/[id]/preview', 'Print view, with no navbar', 'print-button'],
  ['/resumes/[id]/export', 'JSON download, a route handler rather than a page', 'none'],
  ['/templates', 'The three templates rendered with sample data', 'fit-sheet'],
];

export default function ArchitecturePage() {
  return html`
    ${arrowDefs()}
    ${hero({
      kicker: 'Architecture',
      heading: 'One process, one file, five islands.',
      lede: html`Folio turns details typed into forms into a printable A4 resume. It runs as a single server
        with a single SQLite file, sends finished HTML, and adds JavaScript only where a page has to respond
        while someone types. This page is the map. The internals page walks through each mechanism.`,
      actions: html`
        <a class=${buttonClass()} href="/architecture/internals">The internals, with diagrams</a>
        <a class=${buttonClass({ variant: 'outline' })} href="#writes">Two ways to write</a>
      `,
    })}
    ${contents(CONTENTS)}

    ${section({
      id: 'shape',
      heading: 'The shape of the whole thing',
      lede: html`Built on WebJs, a buildless framework: the source files are the files that run, and pages render
        on the server without ever hydrating.`,
      body: html`
        ${systemFigure()}
        <div class="mt-10">
          ${cells([
            ['Pages render, islands respond', html`A page is a function that returns HTML on the server. Anything
              interactive lives in a custom element, and only those five, with the modules they import, reach the
              browser as app code.`],
            ['Actions are the only way in', html`Every write is a ${C("'use server'")} function that takes
              ${C('FormData')}. A form can post to it, and an island can call it over RPC.`],
            ['A sheet is just HTML', html`Resumes are A4 articles styled with Tailwind utilities. The PDF comes
              from the browser's print dialog, so there is no PDF library on the server.`],
            ['Tokens, written once', html`Colours are CSS custom properties written with ${C('light-dark()')} in
              the root layout, so one declaration serves both themes. The resume sheet stays white in both.`],
          ])}
        </div>
        ${sources(['app/layout.ts', 'app/(app)/layout.ts', 'modules/resumes/', 'components/fit-sheet.ts', 'public/input.css'])}
      `,
    })}

    ${section({
      id: 'routes',
      heading: 'Real routes, not one page swapping state',
      lede: html`Two route groups share the root layout. ${C('(app)')} adds the fixed navbar, and ${C('(print)')}
        leaves it out so a sheet prints with nothing around it. Groups do not appear in the address.`,
      body: html`
        ${table({ caption: 'Routes and the islands each one ships', head: ['Route', 'What it is', 'Islands'], rows: ROUTES })}
        <p class="${PROSE} mt-4">Every route under ${C('(app)')} also ships ${C('theme-toggle')} through the navbar.</p>
        ${sources(['app/(app)/', 'app/(print)/resumes/[id]/preview/page.ts', 'app/(print)/resumes/[id]/export/route.ts'])}
      `,
    })}

    ${section({
      id: 'writes',
      heading: 'Two ways to write, one code path',
      lede: html`Eleven actions cover every change. Each works from a plain form post, and the editor adds autosave
        on top by calling the same function.`,
      body: html`
        ${cells([
          ['With JavaScript off', html`The form posts to the page. Success answers 303 back to the editor. A failed
            check answers 422 and renders the page again with the error and everything that was typed.`],
          ['With JavaScript on', html`${C('draft-form')} wraps the same form. It mirrors each keystroke into the
            preview, then calls the same action over RPC 700 ms after the last input and shows the result.`],
        ])}
        ${plainly(html`Saving works without any script, because the forms are real forms. The script only makes it
          feel instant.`)}
        <p class="${PROSE} mt-6"><a class=${LINK} href="/architecture/internals#autosave">The internals page</a> draws
          both paths.</p>
        ${sources(['modules/resumes/actions/', 'modules/resumes/components/draft-form.ts', 'modules/resumes/utils/parse-section.ts'])}
      `,
    })}

    ${section({
      id: 'sheet',
      heading: 'One sheet, everywhere',
      lede: html`The editor preview, the print page and every thumbnail call the same function, so they cannot
        drift apart.`,
      body: html`
        ${sheetFigure()}
        ${sources(['modules/resumes/utils/ui/resume-sheet.ts', 'modules/resumes/utils/ui/templates/', 'lib/utils/ui.ts'])}
      `,
    })}

    ${section({
      id: 'data',
      heading: 'Where data lives',
      lede: html`In one table in one SQLite file. A resume is always edited and rendered as a whole, so its sections
        are JSON columns on its row.`,
      body: html`
        ${dataFigure()}
        <div class="mt-10">
          ${cells([
            ['The resumes', html`${C('db/dev.db')} by default, or wherever ${C('DATABASE_URL')} points. Reached through
              Drizzle, with migrations in ${C('db/migrations')} applied when the server starts.`],
            ['The driver', html`Built into the runtime: ${C('bun:sqlite')} on Bun and ${C('node:sqlite')} on Node, with
              WAL on and a 5 second ${C('busy_timeout')}. There are no native dependencies.`],
            ['The theme choice', html`The only thing kept in the browser, under the key ${C('folio_theme')}. Everything
              a person writes goes to the database.`],
            ['The sample resumes', html`Three fictional people, hard-coded in ${C('sample-data.ts')}. The sample button
              and the seed script both insert them as ordinary rows.`],
          ])}
        </div>
        ${sources(['db/schema.server.ts', 'db/connection.server.ts', 'db/seed.server.ts', 'modules/resumes/utils/store.server.ts', 'modules/resumes/utils/sample-data.ts'])}
      `,
    })}

    ${section({
      id: 'left-out',
      heading: 'What it leaves out, on purpose',
      body: html`
        ${cells([
          ['No accounts', html`Every resume is visible to whoever runs the app. It is a personal tool, so anyone who
            hosts it publicly needs to put access control in front of it first.`],
          ['No server-side PDF', html`The browser's print pipeline does it. That keeps the app free of a headless
            browser and a rendering dependency, at the price of the person pressing Save as PDF.`],
          ['No AI', html`Samples are fixed data, and the app makes no calls to outside services for them. It holds no
            API keys or other credentials.`],
          ['No build step', html`The source runs as written. Tailwind is the one thing compiled, into a stylesheet that
            is regenerated and never committed.`],
        ])}
      `,
    })}
  `;
}
