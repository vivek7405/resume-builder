import { html } from '@webjsdev/core';
import type { Metadata } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { inputClass } from '#components/ui/input.ts';
import { fieldClass, fieldDescriptionClass, fieldErrorClass, fieldLabelClass } from '#components/ui/field.ts';
import { pageHeader, sampleForm, sheetThumb } from '#lib/utils/ui.ts';
import '#components/fit-sheet.ts';
import { createResume } from '#modules/resumes/actions/create-resume.server.ts';
import { TEMPLATES } from '#modules/resumes/types.ts';
import { SAMPLE_RESUMES } from '#modules/resumes/utils/sample-data.ts';

export const metadata: Metadata = { title: 'New resume | Folio' };

interface NewProps { actionData?: { fieldErrors?: Record<string, string>; values?: Record<string, string> } }

export default function NewResume({ actionData }: NewProps) {
  const errors = actionData?.fieldErrors ?? {};
  const values = actionData?.values ?? {};
  const chosen = values.template ?? 'classic';
  return html`
    ${pageHeader('New resume', 'Name it for yourself (the name is never printed), pick a template, and start filling it in.')}
    <form action=${createResume} class="max-w-3xl">
      <div class=${fieldClass()} data-slot="field" data-orientation="vertical" data-invalid=${errors.title ? 'true' : null}>
        <label for="title" class=${fieldLabelClass()} data-slot="field-label">Resume name</label>
        <input id="title" name="title" class="${inputClass()} max-w-md" value=${values.title ?? ''} placeholder="Backend roles 2026" required autofocus
          aria-invalid=${errors.title ? 'true' : null} aria-describedby=${errors.title ? 'title-error' : 'title-hint'}>
        ${errors.title
          ? html`<p id="title-error" class=${fieldErrorClass()} role="alert">${errors.title}</p>`
          : html`<p id="title-hint" class=${fieldDescriptionClass()}>You can keep several resumes, one per kind of role.</p>`}
      </div>

      <fieldset class="m-0 mt-8 border-0 p-0">
        <legend class="mb-3 text-sm font-medium">Template</legend>
        <div class="grid gap-4 sm:grid-cols-3">
          ${TEMPLATES.map((t) => html`
            <label class="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-border-strong has-[:checked]:border-foreground has-[:checked]:ring-1 has-[:checked]:ring-foreground">
              <input type="radio" name="template" value=${t.id} ?checked=${chosen === t.id} class="sr-only">
              <div class="rounded-lg bg-muted/60 p-2">${sheetThumb({ ...SAMPLE_RESUMES[0].doc, template: t.id }, 0.3)}</div>
              <span class="px-1 pb-1">
                <span class="block text-sm font-semibold">${t.name}</span>
                <span class="block text-xs text-muted-foreground">${t.blurb}</span>
              </span>
            </label>`)}
        </div>
      </fieldset>

      <div class="mt-8 flex items-center gap-3">
        <button type="submit" class=${buttonClass()}>Create resume</button>
        <a href="/resumes" class=${buttonClass({ variant: 'ghost' })}>Cancel</a>
      </div>
    </form>

    <section class="mt-14 max-w-3xl border-t border-border pt-10">
      <h2 class="m-0 text-lg font-semibold">Or start from a sample</h2>
      <p class="m-0 mb-4 mt-1 text-sm text-muted-foreground">Creates a complete, fictional resume to edit or delete, so you can see what Folio produces.</p>
      ${sampleForm({ variant: 'secondary' })}
    </section>
  `;
}
