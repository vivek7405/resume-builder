import { html, notFound } from '@webjsdev/core';
import type { Metadata, PageProps } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { pageHeader } from '#lib/utils/ui.ts';
import { deleteResume } from '#modules/resumes/actions/delete-resume.server.ts';
import { getResume } from '#modules/resumes/queries/get-resume.server.ts';

export const metadata: Metadata = { title: 'Delete resume | Folio', robots: { index: false } };

/** A confirmation page rather than a dialog, so deleting works with JavaScript off. */
export default async function DeleteResume({ params }: PageProps<'/resumes/[id]/delete'>) {
  const resume = await getResume(params.id);
  if (!resume) notFound();
  return html`
    <div class="max-w-lg">
      ${pageHeader('Delete this resume?', html`<strong class="text-foreground">${resume.title}</strong> will be removed for good. There is no undo.`)}
      <form action=${deleteResume} class="flex items-center gap-3">
        <input type="hidden" name="resumeId" value=${resume.id}>
        <button type="submit" class=${buttonClass({ variant: 'destructive' })}>Delete resume</button>
        <a href="/resumes/${resume.id}" class=${buttonClass({ variant: 'ghost' })}>Keep it</a>
      </form>
    </div>
  `;
}
