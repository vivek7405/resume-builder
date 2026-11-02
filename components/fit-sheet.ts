import { WebComponent, html } from '@webjsdev/core';

/**
 * Scales a slotted A4 sheet (210mm wide) to the host's width. The page passes
 * a first-paint scale through the --s custom property on the host, so the SSR
 * layout is already close; after hydration a ResizeObserver keeps it exact
 * and sizes the frame to the scaled sheet height so a long resume is never
 * clipped and a short one leaves no gap.
 */
export class FitSheet extends WebComponent {
  private observer: ResizeObserver | null = null;

  private fit = () => {
    const SHEET_PX = (210 / 25.4) * 96;
    const width = this.getBoundingClientRect().width;
    if (!width) return;
    const scale = width / SHEET_PX;
    this.style.setProperty('--s', scale.toFixed(4));
    const sheet = this.querySelector<HTMLElement>('.resume-sheet');
    const frame = this.querySelector<HTMLElement>('[data-frame]');
    if (sheet && frame && sheet.offsetHeight) frame.style.height = `${sheet.offsetHeight * scale}px`;
  };

  // The slotted sheet is projected one microtask after the first client
  // render, so the observers are attached here rather than in connectedCallback.
  firstUpdated() {
    this.observer = new ResizeObserver(this.fit);
    this.observer.observe(this);
    queueMicrotask(() => {
      const sheet = this.querySelector('.resume-sheet');
      if (sheet) this.observer?.observe(sheet);
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
