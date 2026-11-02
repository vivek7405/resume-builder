import { html } from '@webjsdev/core';
import type { LayoutProps } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { cn } from '#lib/utils/cn.ts';
import '#components/theme-toggle.ts';

/**
 * The app chrome: a fixed navbar (position: fixed, never sticky, which
 * flickers on iOS during a client-router navigation) and the content column.
 * The root layout reserves the navbar height on <body> through --header-h,
 * and this layout sets its first-paint value so nothing jumps before the
 * measure script runs. The (print) group has no navbar and keeps 0px.
 */
export default function AppLayout({ children, url }: LayoutProps) {
  const path = new URL(url).pathname;
  const link = (href: string, label: string) => {
    const active = path === href || (href !== '/' && path.startsWith(href));
    return html`<a href=${href} aria-current=${active ? 'page' : null}
      class="no-underline text-sm transition-colors ${active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}">${label}</a>`;
  };
  return html`
    <style>:root { --header-h: 3.5rem; }</style>
    <header data-app-header class="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 [border-right:var(--wj-scrollbar-compensation,0px)_solid_transparent]">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <a href="/" class="inline-flex items-center gap-2 no-underline text-foreground">
          <span aria-hidden="true" class="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 7h12M6 12h8M6 17h5"/></svg>
          </span>
          <span class="font-display text-[1.35rem] leading-none tracking-tight">Folio</span>
        </a>
        <nav class="flex items-center gap-5" aria-label="Primary">
          ${link('/resumes', 'Resumes')}
          ${link('/templates', 'Templates')}
          <a href="/resumes/new" class=${cn(buttonClass({ size: 'sm' }), 'hidden sm:inline-flex')}>New resume</a>
          <theme-toggle></theme-toggle>
        </nav>
      </div>
    </header>
    <main class="mx-auto min-h-[calc(100dvh-3.5rem)] w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      ${children}
    </main>
  `;
}
