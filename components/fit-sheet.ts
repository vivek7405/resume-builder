import { WebComponent, html } from '@webjsdev/core';

/**
 * Scales a slotted A4 sheet (210mm wide) to the host's width.
 *
 * The scale is computed in CSS first (root layout: the host is a size
 * container and the frame's --s is calc(100cqw / 210mm)), so the first paint
 * is exact and nothing jumps on hydration. Browsers without typed arithmetic
 * fall back to the --s-guess the page passes on the host. After hydration a
 * ResizeObserver writes the same number and sizes the frame to the scaled
 * sheet height so a long resume is never clipped and a short one leaves no gap.
 */
export class FitSheet extends WebComponent {
  private observer: ResizeObserver | null = null;

  private fit = () => {
    const SHEET_PX = (210 / 25.4) * 96;
    const width = this.getBoundingClientRect().width;
    if (!width) return;
    const scale = width / SHEET_PX;
    const inner = this.querySelector<HTMLElement>('[data-frame] > div');
    const frame = this.querySelector<HTMLElement>('[data-frame]');
    if (!frame) return;
    frame.style.setProperty('--s', scale.toFixed(4));
    if (inner && inner.offsetHeight) frame.style.height = `${inner.offsetHeight * scale}px`;
  };

  // The slotted sheet is projected one microtask after the first client
  // render, so the observers are attached here rather than in connectedCallback.
  // The inner wrapper is observed (not the slotted article), since the preview
  // swaps the article when the template changes.
  firstUpdated() {
    this.observer = new ResizeObserver(this.fit);
    this.observer.observe(this);
    queueMicrotask(() => {
      const inner = this.querySelector('[data-frame] > div');
      if (inner) this.observer?.observe(inner);
      this.fit();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observer = null;
  }

  render() {
    return html`
      <div data-frame class="relative w-full overflow-hidden aspect-[210/297]">
        <div class="absolute left-0 top-0 w-[210mm] origin-top-left" style="transform: scale(var(--s, 0.4))">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
FitSheet.register('fit-sheet');
