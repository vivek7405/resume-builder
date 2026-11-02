import { WebComponent, prop, html } from '@webjsdev/core';
import type { ResumeDocument } from '../types.ts';
import { baseDocument, draft, resetDraft } from '../draft.ts';
import { resumeSheet } from '../utils/ui/resume-sheet.ts';
import '#components/fit-sheet.ts';

/**
 * The live preview: the saved document (seeded by the page through
 * .resume=) with the draft layered on top, so the sheet follows the forms
 * as the user types. Scaled to its column by <fit-sheet>.
 */
export class ResumePreview extends WebComponent({
  resume: prop<ResumeDocument>(Object),
  scale: Number,
}) {
  constructor() {
    super();
    this.scale = 0.6;
  }

  connectedCallback() {
    super.connectedCallback();
    baseDocument.set(this.resume);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    resetDraft();
  }

  render() {
    const merged: ResumeDocument = { ...this.resume, ...draft.get() };
    return html`
      <fit-sheet class="block w-full shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.35)]" style="--s-guess: ${this.scale}">
        ${resumeSheet(merged)}
      </fit-sheet>
    `;
  }
}
ResumePreview.register('resume-preview');
