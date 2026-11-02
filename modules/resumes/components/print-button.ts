import { WebComponent, html } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';

/** "Print or save as PDF": the browser's print pipeline over the print stylesheet. */
export class PrintButton extends WebComponent {
  render() {
    return html`
      <button type="button" class=${buttonClass({ size: 'sm' })} @click=${() => window.print()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></svg>
        Print or save as PDF
      </button>
    `;
  }
}
PrintButton.register('print-button');
