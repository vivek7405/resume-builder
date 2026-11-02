import { WebComponent, html } from '@webjsdev/core';

/**
 * Wraps a slotted form whose action takes a while (the AI sample generator).
 * On submit it marks the form busy and swaps the submit label for the
 * button's data-pending text; the client router then posts the form and
 * applies the response. With JavaScript off the form submits as usual.
 */
export class FormPending extends WebComponent {
  private onSubmit = (e: Event) => {
    const form = e.target as HTMLFormElement | null;
    if (!form || form.tagName !== 'FORM') return;
    form.setAttribute('aria-busy', 'true');
    const submitter = (e as SubmitEvent).submitter ?? form.querySelector<HTMLButtonElement>('button[type="submit"], button:not([type])');
    if (submitter instanceof HTMLButtonElement) {
      const pending = submitter.dataset.pending;
      if (pending) submitter.textContent = pending;
      // Disable after this tick so the submit still carries the button's own name/value.
      queueMicrotask(() => { submitter.disabled = true; });
    }
  };

  render() {
    return html`<div @submit=${this.onSubmit}><slot></slot></div>`;
  }
}
FormPending.register('form-pending');
