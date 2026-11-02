// App-wide html fragments: repeated markup chunks rendered at SSR time.
//
// The pages that render sheetThumb import fit-sheet themselves, so the island
// is emitted only where a sheet appears.
//
// The elision analyser matches the bare word for the browser's document
// global, including inside a kebab-case import path or a property name. Keep
// that word out of code reached by a page, or the page ships whole. This is
// why the fragment is resume-sheet.ts and the sample field is doc.
import { html } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { generateSample } from '#modules/resumes/actions/generate-sample.server.ts';
import { resumeSheet } from '#modules/resumes/utils/ui/resume-sheet.ts';
import type { ResumeDocument, TemplateId } from '#modules/resumes/types.ts';

/** The page title row: an h1, an optional lede, and actions on the right. */
export function pageHeader(title: unknown, lede?: unknown, actions?: unknown) {
  return html`
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div class="max-w-2xl">
        <h1 class="m-0 font-display text-4xl leading-none tracking-tight sm:text-5xl">${title}</h1>
        ${lede ? html`<p class="m-0 mt-3 text-base text-muted-foreground">${lede}</p>` : ''}
      </div>
      ${actions ? html`<div class="flex flex-wrap items-center gap-2">${actions}</div>` : ''}
    </div>`;
}

/**
 * A decorative sheet scaled to its container. `scale` is the first-paint
 * guess (container width / 794px). The sheet carries links of its own, so it
 * is inert and never placed inside another anchor: nested anchors make the
 * HTML parser hoist the sheet out of its scaler.
 */
export function sheetThumb(doc: ResumeDocument, scale: number, cls = '') {
  return html`
    <fit-sheet class="block w-full ${cls}" style="--s-guess: ${scale}" inert aria-hidden="true">
      ${resumeSheet(doc)}
    </fit-sheet>`;
}

/** The "Generate a sample resume" form. The template rides a hidden field when a page wants one. */
export function sampleForm(opts: { template?: TemplateId; variant?: 'default' | 'outline' | 'secondary'; size?: 'default' | 'sm' | 'lg' } = {}) {
  return html`
    <form action=${generateSample}>
      ${opts.template ? html`<input type="hidden" name="template" value=${opts.template}>` : ''}
      <button type="submit" class=${buttonClass({ variant: opts.variant ?? 'outline', size: opts.size ?? 'default' })}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 19l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>
        Generate a sample resume
      </button>
    </form>`;
}
