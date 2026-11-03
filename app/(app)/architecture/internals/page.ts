/**
 * /architecture/internals
 *
 * The deep dive under /architecture: routing, autosave, the form path, the
 * sheet, scaling, print, samples, the theme, what ships and how it is verified.
 * /architecture answers "what is it made of". This page answers "how does it
 * actually work", for someone about to change it.
 *
 * Every number names the constant it comes from, so the page can be checked
 * against the code. If they disagree, the code is right and this page is a bug.
 */
import { html } from '@webjsdev/core';
import type { Metadata } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { arrowDefs } from '#modules/architecture/utils/diagram.ts';
import { formFigure, keystrokeFigure, printFigure, scaleFigure } from '#modules/architecture/utils/internals-figures.ts';
import { C, cells, contents, glossary, hero, LINK, plainly, PROSE, section, sources, steps, table, wire } from '#modules/architecture/utils/page.ts';

export const metadata: Metadata = {
  title: 'Architecture internals | Folio',
  description: 'How Folio works, mechanism by mechanism: autosave, the form path, the scaled A4 sheet, print, what ships to the browser and how it is verified.',
};

const CONTENTS: [string, string][] = [
  ['plain', 'Start here'],
  ['autosave', 'Autosave'],
  ['forms', 'Forms'],
  ['actions', 'Actions'],
  ['scale', 'Scaling'],
  ['print', 'Print'],
  ['samples', 'Samples'],
  ['theme', 'Theme'],
  ['ships', 'What ships'],
  ['verify', 'Verification'],
  ['words', 'Glossary'],
];

const ACTIONS: unknown[][] = [
  ['createResume', 'Inserts an empty resume', '303 to the editor'],
  ['generateSample', 'Inserts a random sample with a random accent', '303 to the editor, with ?sample=1'],
  ['duplicateResume', 'Copies a row as "Copy of ..."', '303 to the copy'],
  ['deleteResume', 'Deletes the row', '303 to /resumes'],
  ['updateProfile', 'Replaces profile, and checks the email shape', 'Result, no redirect'],
  ['updateSettings', 'Replaces the title, template and accent', 'Result, no redirect'],
  ['updateSkills', 'Replaces skills', 'Result, no redirect'],
  ['saveEntry', 'Replaces one entry by index', 'Result, no redirect'],
  ['addEntry', 'Appends an empty entry', '303 to the new entry'],
  ['moveEntry', 'Swaps an entry with its neighbour', '303 to where it landed'],
  ['removeEntry', 'Removes one entry by index', '303 to the section'],
];

const WORDS: [string, unknown][] = [
  ['island', 'A custom element that runs in the browser, surrounded by HTML that does not. Folio has five. Everything else on a page is inert markup.'],
  ['hydration', 'A component picking up in the browser where the server left off, attaching its handlers to the HTML it already rendered. Pages never do this here, and only islands do.'],
  ['action', 'A function in a file marked \'use server\'. It runs on the server, and can be bound to a form or called from an island as if it were local.'],
  ['RPC', 'A remote procedure call: the browser calls a server function by name and gets its return value. WebJs generates the client side from the action\'s import.'],
  ['PRG', 'Post, redirect, get. A successful form post answers with a redirect, so the page the person lands on came from a GET and refreshing it does not post again.'],
  ['route group', 'A folder in parentheses, like (print). It shares a layout between routes and does not appear in the address.'],
  ['signal', 'A value that remembers who read it, and re-renders those readers when it changes. The draft is one, at module scope, so two islands with no parent in common can share it.'],
  ['container query unit', 'A CSS length measured from a container rather than the viewport. 100cqw is the full width of the nearest size container.'],
  ['typed arithmetic', 'CSS dividing one length by another to get a plain number. It is what lets 100cqw / 210mm produce a scale. Browsers without it use the guess the page passes.'],
  ['elision', 'WebJs leaving a module out of what the browser downloads, after static analysis shows the browser has no use for it.'],
];

export default function InternalsPage() {
  return html`
    ${arrowDefs()}
    ${hero({
      kicker: 'Architecture internals',
      heading: 'Folio, mechanism by mechanism.',
      lede: html`Autosave, the form path, the scaled sheet, print, and what actually reaches the browser. Each
        section names the files that implement it and the constants behind its numbers.`,
      actions: html`<a class=${buttonClass({ variant: 'outline' })} href="/architecture">Back to the overview</a>`,
    })}
    ${contents(CONTENTS)}

    ${section({
      id: 'plain',
      heading: 'The whole idea, before the detail',
      body: html`
        <div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="flex min-w-0 flex-col gap-4">
            <p class=${PROSE}>Folio is a set of ordinary web forms. Each section of a resume is a form, and submitting
              one stores that section. If the browser ran no JavaScript at all, every feature except the live preview,
              the theme toggle and the print button would still work.</p>
            <p class=${PROSE}>Two small scripts then make the editor feel immediate. One watches the forms and copies
              what is typed into a shared value. The other draws the resume from that value. Neither knows about the
              other, and saving is the same call the form would have made.</p>
            <p class=${PROSE}>The resume itself is HTML laid out at the true width of A4 paper. On screen it is scaled
              down to fit, and on paper it is printed at full size, so the line breaks in the preview are the line
              breaks on the page.</p>
          </div>
          <div class="min-w-0 rounded-xl border border-border bg-card p-6">
            <p class="m-0 font-semibold">What must never happen</p>
            <p class="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">A feature that only works with JavaScript
              when a form could do it. A preview that differs from the printed page. A page shipping whole to the browser.</p>
            <hr class="my-5 border-0 border-t border-border">
            <p class="m-0 font-semibold">Where the truth is</p>
            <p class="m-0 mt-2 text-sm leading-relaxed text-muted-foreground">The row in SQLite. The draft in the browser
              is a layer over it, and it is thrown away when the preview disconnects.</p>
          </div>
        </div>
      `,
    })}

    ${section({
      id: 'autosave',
      heading: 'A keystroke, end to end',
      lede: html`Two islands share a module signal. ${C('draft-form')} writes it, ${C('resume-preview')} reads it, and
        neither is a parent of the other.`,
      body: html`
        ${keystrokeFigure()}
        <div class="mt-10">
          ${steps([
            ['The form stays free HTML', html`${C('draft-form')} wraps a page-rendered form through a light-DOM slot and
              listens for ${C('input')}, ${C('change')} and ${C('submit')} as they bubble. It holds no field state,
              and reads the form with ${C('new FormData(form)')} each time.`],
            ['The preview is a merge', html`${C('resume-preview')} is seeded with the saved row and renders
              ${C('{ ...this.resume, ...draft.get() }')}. Reading the signal inside render is what subscribes it.`],
            ['List sections patch one index', html`An entry form knows its index, so it copies the current array through
              ${C('currentSection()')}, replaces its own slot, and patches the whole array. Two entries edited in turn
              both survive, because each builds on the draft and not the saved row.`],
            ['Saving is debounced, submitting is not', html`Each input restarts a timer of ${C('AUTOSAVE_MS')} (700). Pressing
              Save cancels the timer and saves at once. Either way the form is read again at save time.`],
            ['A failure keeps the text', html`A refused save shows the action's message in the status line. A network
              failure says the changes are still there. Nothing clears the fields.`],
          ])}
        </div>
        ${plainly(html`Typing changes what you see immediately, and the save follows a moment after you stop.`)}
        ${sources(['modules/resumes/components/draft-form.ts', 'modules/resumes/components/resume-preview.ts', 'modules/resumes/draft.ts', 'modules/resumes/utils/parse-section.ts'])}
      `,
    })}

    ${section({
      id: 'forms',
      heading: 'The same write, with no script',
      lede: html`Binding an action to a form is ${C('<form action=${fn}>')}. Nothing else is needed for it to work from a
        plain post.`,
      body: html`
        ${formFigure()}
        <div class="mt-10 grid gap-6 lg:grid-cols-2">
          ${wire('Success', [
            ['POST /resumes/new'],
            ['title=Backend roles&template=modern'],
            [''],
            ['303 See Other'],
            ['Location: /resumes/<id>', 'from { success: true, redirect }'],
          ])}
          ${wire('Failure', [
            ['POST /resumes/new'],
            ['title=&template=modern'],
            [''],
            ['422 Unprocessable Content'],
            ['the same page, as HTML', 'from { success: false, fieldErrors, status: 422 }'],
          ])}
        </div>
        <p class="${PROSE} mt-8">The editor has many forms on one page, so each carries a hidden envelope of
          ${C('resumeId')}, ${C('section')} and ${C('index')}. On a failed post the page reads it back from
          ${C('actionData')}, and shows the error and the typed values only on the form that failed.</p>
        ${sources(['app/(app)/resumes/[id]/page.ts', 'app/(app)/resumes/new/page.ts', 'test/resumes/pages.test.ts', 'test/resumes/editor.test.ts'])}
      `,
    })}

    ${section({
      id: 'actions',
      heading: 'Eleven actions, one per file',
      lede: html`All of them take ${C('FormData')}, so a form post and an RPC call arrive in the same shape. Reads are the
        two queries, ${C('listResumes')} and ${C('getResume')}.`,
      body: html`
        ${table({ caption: 'Every action and what it answers with', head: ['Action', 'What it does', 'On success'], rows: ACTIONS })}
        <p class="${PROSE} mt-8">Input is bounded in one place. ${C('LIMITS')} in ${C('parse-section.ts')} cuts short fields
          at 120 characters and long ones at 4000, and a month must match ${C('YYYY-MM')} or it is dropped. A template or
          accent that is not on the list falls back to the default.</p>
        ${sources(['modules/resumes/actions/', 'modules/resumes/queries/', 'modules/resumes/utils/store.server.ts', 'test/resumes/actions.test.ts'])}
      `,
    })}

    ${section({
      id: 'scale',
      heading: 'Fitting A4 into a column',
      lede: html`${C('fit-sheet')} shows a sheet at any width without changing how it lays out. An earlier version set the
        scale from JavaScript after load, and the sheet visibly zoomed. It is now CSS first.`,
      body: html`
        ${scaleFigure()}
        <p class="${PROSE} mt-8">A transform does not change layout, so the frame still has to be the scaled height. Before
          hydration, ${C('aspect-[210/297]')} holds one page. After it, the island measures the inner wrapper and sets the
          height, so a two-page resume is not clipped. It observes the wrapper rather than the article, because changing
          template swaps the article.</p>
        ${sources(['components/fit-sheet.ts', 'app/layout.ts', 'test/resumes/browser/fit-sheet.test.js'])}
      `,
    })}

    ${section({
      id: 'print',
      heading: 'Print',
      lede: html`The print page lives in ${C('(print)')}, so it has no navbar, and the stylesheet in the root layout does the
        rest.`,
      body: html`
        ${printFigure()}
        <div class="mt-10">
          ${cells([
            ['A page, not a guess', html`${C('@page { size: A4; margin: 0 }')} gives the sheet the whole page, and the
              sheet carries its own padding.`],
            ['Just under A4', html`The sheet is ${C('min-height: 297mm')} on screen and ${C('296mm')} in print, so a one-page
              resume fills its page without spilling a blank second one.`],
            ['Entries stay whole', html`${C('break-inside: avoid')} on each ${C('article')} moves an entry to the next page
              rather than splitting it.`],
            ['Padding repeats', html`${C('box-decoration-break: clone')} gives each continuation page the padding, so a long
              resume is not flush against the paper edge.`],
            ['Tints print', html`${C('print-color-adjust: exact')} prints the Modern sidebar and accents with the browser's
              background graphics option off.`],
            ['Screen layout is flattened', html`${C('.print-flow')} removes the backdrop, the flex layout and the overflow,
              which would otherwise confine a long sheet to one page.`],
          ])}
        </div>
        ${sources(['app/layout.ts', 'app/(print)/resumes/[id]/preview/page.ts', 'modules/resumes/components/print-button.ts', 'test/resumes/e2e/resume-flow.test.ts'])}
      `,
    })}

    ${section({
      id: 'samples',
      heading: 'Samples and seed',
      body: html`
        <p class=${PROSE}>${C('SAMPLE_RESUMES')} holds three complete fictional resumes, typed in TypeScript with no external
          calls. ${C('generateSample')} picks one with ${C('randomSample()')}, uses the requested template or the sample's
          own, picks one of the six accents in ${C('ACCENTS')} and inserts an ordinary row. From there it is any other resume.
          ${C('bun run db:seed')} inserts all three, and only when the table is empty.</p>
        <p class="${PROSE} mt-4">The sample's field is ${C('doc')} and the fragment is ${C('resume-sheet.ts')}, for a reason that has
          nothing to do with resumes. <a class=${LINK} href="#ships">What reaches the browser</a> explains it.</p>
        ${sources(['modules/resumes/utils/sample-data.ts', 'modules/resumes/actions/generate-sample.server.ts', 'db/seed.server.ts'])}
      `,
    })}

    ${section({
      id: 'theme',
      heading: 'Theme',
      body: html`
        <p class=${PROSE}>An inline script in the root layout applies the saved choice before first paint, so nothing flashes.
          ${C('data-theme')} forces a scheme and otherwise the OS decides, which ${C('light-dark()')} and ${C('color-scheme')}
          resolve with no script at all. The ${C('.dark')} class is kept in step for the UI kit's dark variants.
          ${C('theme-toggle')} cycles system, light and dark. The sheet uses the paper tokens, which do not change with the
          theme, because paper is white.</p>
        ${sources(['app/layout.ts', 'components/theme-toggle.ts', 'public/input.css', 'test/theme/browser/theme-toggle.test.js'])}
      `,
    })}

    ${section({
      id: 'ships',
      heading: 'What reaches the browser',
      lede: html`WebJs analyses every module statically and leaves out what the browser has no use for.
        ${C('bunx webjs elision')} prints the result and the evidence for it.`,
      body: html`
        ${wire('Why each island ships', [
          ['fit-sheet', 'overrides a lifecycle hook'],
          ['theme-toggle', 'uses a reactive primitive'],
          ['draft-form', 'uses a reactive primitive'],
          ['print-button', 'has an event binding'],
          ['resume-preview', 'overrides a lifecycle hook'],
        ])}
        <p class="${PROSE} mt-8">Pages either ship nothing (inert) or only emit imports for the islands they use
          (import-only). A page that referred to a browser global would ship whole, and no route here does. The analyser
          matches those names as plain words, including inside an import path or a property name. A file named after the
          browser's global for the page once made routes ship whole, which is why that word is avoided in code a page reaches.</p>
        ${plainly(html`A visitor downloads the framework runtime and the islands a page actually uses, and none of the page code.`)}
        ${sources(['lib/utils/ui.ts', 'modules/resumes/utils/ui/resume-sheet.ts'])}
      `,
    })}

    ${section({
      id: 'verify',
      heading: 'How it is verified',
      lede: html`GitHub Actions runs every check on each pull request and each push to ${C('main')}, one job per check. Each job
        runs one entry of the step list in ${C('package.json')}, under ${C('webjs.ci')}, and a test holds the two together.`,
      body: html`
        ${cells([
          ['Setup and checks', html`${C('webjs db migrate')}, then ${C('webjs check')} for conventions, ${C('webjs doctor')}
            for health, ${C('webjs typecheck')} and ${C('webjs audit')}.`],
          ['Server tests', html`The real request pipeline through ${C('createRequestHandler')}: pages, the 303 and 422 forms,
            and every action. These also check that this page cites only files that exist.`],
          ['Browser tests', html`The islands in a real browser, from server-rendered fixtures: the theme toggle, fit-sheet and
            the editor pair.`],
          ['End-to-end tests', html`Chromium against a booted server: create, type, watch the preview and autosave, one-page
            print for each template, a phone width with no overflow, delete, and no script errors.`],
        ], 'md:grid-cols-2')}
        ${sources(['package.json', '.github/workflows/ci.yml', 'test/resumes/', 'test/architecture/architecture.test.ts', 'test/ci/ci-workflow.test.ts'])}
      `,
    })}

    ${section({
      id: 'words',
      heading: 'The words this page leans on',
      body: html`
        ${glossary(WORDS)}
        <p class="${PROSE} mt-12">If anything here disagrees with the code, the code is right and this page is a bug.
          <a class=${LINK} href="/architecture">Back to the overview</a>.</p>
      `,
    })}
  `;
}
