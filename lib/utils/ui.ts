// App-wide html fragments: repeated markup chunks rendered at SSR time.
import { html } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { inputClass } from '#components/ui/input.ts';
import { generateSample } from '#modules/resumes/actions/generate-sample.server.ts';
import { resumeDocument } from '#modules/resumes/utils/ui/resume-document.ts';
import type { ResumeDocument, TemplateId } from '#modules/resumes/types.ts';
import '#components/fit-sheet.ts';
import '#components/form-pending.ts';

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
      ${resumeDocument(doc)}
    </fit-sheet>`;
}

/**
 * The "Generate a sample resume" form. With `brief` the user can steer the
 * sample; the template rides a hidden field. The button label reflects
 * whether Claude is configured (`ai`), so nobody waits for an API that is
 * not there.
 */
export function sampleForm(opts: { ai: boolean; template?: TemplateId; brief?: boolean; variant?: 'default' | 'outline' | 'secondary'; size?: 'default' | 'sm' | 'lg' } = { ai: false }) {
  const label = opts.ai ? 'Generate a sample with Claude' : 'Generate a sample resume';
  return html`
    <form-pending class="block">
      <form action=${generateSample} class="flex flex-wrap items-center gap-2">
        ${opts.template ? html`<input type="hidden" name="template" value=${opts.template}>` : ''}
        ${opts.brief ? html`
          <label class="sr-only" for="brief">Describe the person</label>
          <input id="brief" name="brief" class="${inputClass()} max-w-sm flex-1" placeholder=${opts.ai ? 'e.g. senior backend engineer in fintech' : 'A built-in sample is used until a Claude credential is set'} ?disabled=${!opts.ai}>` : ''}
        <button type="submit" class=${buttonClass({ variant: opts.variant ?? 'outline', size: opts.size ?? 'default' })} data-pending=${opts.ai ? 'Generating with Claude…' : 'Creating…'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 19l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>
          ${label}
        </button>
      </form>
    </form-pending>`;
}
