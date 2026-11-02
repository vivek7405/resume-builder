import { WebComponent, html, signal } from '@webjsdev/core';
import { cn } from '#lib/utils/cn.ts';
import { buttonClass } from '#components/ui/button.ts';

type Theme = 'system' | 'light' | 'dark';

/**
 * Cycles system, light, dark. The theme is a document-wide setting, so it is
 * written on <html> (data-theme forces a scheme, .dark feeds the ui kit) and
 * persisted; the root layout's inline script applies it before first paint.
 */
export class ThemeToggle extends WebComponent {
  private theme = signal<Theme>('system');

  connectedCallback() {
    super.connectedCallback();
    let saved: string | null = null;
    try { saved = localStorage.getItem('folio_theme'); } catch {}
    this.theme.set(saved === 'light' || saved === 'dark' ? saved : 'system');
  }

  cycle() {
    const current = this.theme.get();
    const next: Theme = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
    this.theme.set(next);
    try {
      if (next === 'system') localStorage.removeItem('folio_theme');
      else localStorage.setItem('folio_theme', next);
    } catch {}
    const el = document.documentElement;
    if (next === 'system') delete el.dataset.theme;
    else el.dataset.theme = next;
    const dark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    el.classList.toggle('dark', dark);
  }

  render() {
    const t = this.theme.get();
    const label = t === 'system' ? 'system' : t;
    return html`
      <button type="button"
        class=${cn(buttonClass({ variant: 'ghost', size: 'icon-sm' }), 'rounded-full text-muted-foreground hover:text-foreground')}
        @click=${() => this.cycle()}
        aria-label="Theme: ${label}. Click to change."
        title="Theme: ${label}">
        ${t === 'light' ? ICONS.sun : t === 'dark' ? ICONS.moon : ICONS.system}
      </button>
    `;
  }
}

const ICONS = {
  sun: html`<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  moon: html`<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>`,
  system: html`<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v11H3zM8 20h8M12 16v4"/></svg>`,
};

ThemeToggle.register('theme-toggle');
