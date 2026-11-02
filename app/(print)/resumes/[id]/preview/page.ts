import { html, notFound } from '@webjsdev/core';
import type { Metadata, MetadataContext, PageProps } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { getResume } from '#modules/resumes/queries/get-resume.server.ts';
import { resumeDocument } from '#modules/resumes/utils/ui/resume-document.ts';
import { TEMPLATES } from '#modules/resumes/types.ts';
import '#modules/resumes/components/print-button.ts';

export async function generateMetadata({ params }: MetadataContext): Promise<Metadata> {
  const resume = await getResume(String(params.id));
  return { title: resume ? `${resume.profile.fullName || resume.title} | Preview` : 'Preview', robots: { index: false } };
}

/**
 * The print view: the sheet alone on a muted backdrop, with a slim toolbar
 * the print stylesheet hides. Lives outside the (app) group so it carries no
 * navbar, and the sheet prints edge to edge on A4.
 */
export default async function Preview({ params }: PageProps<'/resumes/[id]/preview'>) {
  const resume = await getResume(params.id);
  if (!resume) notFound();
  const template = TEMPLATES.find((t) => t.id === resume.template)?.name ?? 'Classic';
  return html`
    <div class="min-h-dvh bg-muted/60 print:bg-paper">
      <div class="no-print border-b border-border bg-background">
        <div class="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <a href="/resumes/${resume.id}" class="${buttonClass({ variant: 'ghost', size: 'sm' })} -ml-2 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            Back to editor
          </a>
          <p class="m-0 text-sm text-muted-foreground">${resume.title} <span aria-hidden="true">·</span> ${template}</p>
          <div class="flex items-center gap-2">
            <a href="/resumes/${resume.id}/export" download="${resume.title}.json" data-no-router class=${buttonClass({ variant: 'outline', size: 'sm' })}>Export JSON</a>
            <print-button></print-button>
          </div>
        </div>
      </div>
      <div class="mx-auto flex max-w-[calc(210mm+2rem)] justify-start overflow-x-auto px-4 py-8 print:p-0 sm:justify-center">
        <div class="shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(0,0,0,0.25)] print:shadow-none">
          ${resumeDocument(resume)}
        </div>
      </div>
    </div>
  `;
}
