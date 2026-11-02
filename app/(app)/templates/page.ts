import { html } from '@webjsdev/core';
import type { Metadata } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { pageHeader, sampleForm, sheetThumb } from '#lib/utils/ui.ts';
import '#components/fit-sheet.ts';
import { createResume } from '#modules/resumes/actions/create-resume.server.ts';
import { TEMPLATES } from '#modules/resumes/types.ts';
import { sampleFor } from '#modules/resumes/utils/sample-data.ts';

export const metadata: Metadata = {
  title: 'Templates | Folio',
  description: 'Three resume templates: Classic, Modern and Minimal. Switch any time without losing content.',
};

export default function Templates() {
  return html`
    ${pageHeader('Templates', 'Three layouts, one document. Pick one now and switch any time from the editor.')}
    <div class="grid gap-10 lg:grid-cols-3">
      ${TEMPLATES.map((t) => {
        const doc = { ...sampleFor(t.id).document, template: t.id };
        return html`
          <section class="flex flex-col gap-4">
            <div class="relative">
              <div class="rounded-2xl border border-border bg-muted/50 p-4 transition-colors hover:bg-muted">
                ${sheetThumb(doc, 0.46, 'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_18px_40px_-20px_rgba(0,0,0,0.35)]')}
              </div>
              <a href="/resumes/new" class="absolute inset-0 rounded-2xl" aria-label="Start a ${t.name} resume"></a>
            </div>
            <div>
              <h2 class="m-0 font-display text-3xl leading-none">${t.name}</h2>
              <p class="m-0 mt-2 text-sm text-muted-foreground">${t.blurb}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <form action=${createResume}>
                <input type="hidden" name="title" value="Untitled ${t.name} resume">
                <input type="hidden" name="template" value=${t.id}>
                <button type="submit" class=${buttonClass({ size: 'sm' })}>Start with ${t.name}</button>
              </form>
              ${sampleForm({ template: t.id, size: 'sm' })}
            </div>
          </section>`;
      })}
    </div>
  `;
}
