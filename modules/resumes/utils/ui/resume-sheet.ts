// The one source of truth for how a resume renders: the print page renders
// it as free HTML and the preview island renders it live while typing.
import { html } from '@webjsdev/core';
import type { ResumeDocument } from '../../types.ts';
import { classicTemplate } from './templates/classic.ts';
import { modernTemplate } from './templates/modern.ts';
import { minimalTemplate } from './templates/minimal.ts';

/** An A4 sheet. `.resume-sheet` is what the print stylesheet targets. */
export function resumeSheet(doc: ResumeDocument) {
  const padded = doc.template !== 'modern';
  return html`
    <article class="resume-sheet box-border w-[210mm] min-h-[297mm] bg-paper text-paper-foreground ${padded ? 'px-[18mm] py-[16mm]' : ''}" style="--accent: ${doc.accent}" lang="en">
      ${doc.template === 'modern' ? modernTemplate(doc) : doc.template === 'minimal' ? minimalTemplate(doc) : classicTemplate(doc)}
    </article>
  `;
}
