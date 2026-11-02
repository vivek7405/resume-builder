import { html } from '@webjsdev/core';
import type { Metadata } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { badgeClass } from '#components/ui/badge.ts';
import { pageHeader, sampleForm, sheetThumb } from '#lib/utils/ui.ts';
import { listResumes } from '#modules/resumes/queries/list-resumes.server.ts';
import { aiEnabled } from '#modules/resumes/queries/ai-status.server.ts';
import { SAMPLE_RESUMES } from '#modules/resumes/utils/sample-data.ts';
import { TEMPLATES } from '#modules/resumes/types.ts';
import { timeAgo } from '#modules/resumes/utils/format.ts';

export const metadata: Metadata = {
  title: 'Folio',
  description: 'A minimalistic resume builder. Fill in the details, pick a template, print a beautiful PDF.',
};

export default async function Home() {
  const [recent, ai] = await Promise.all([listResumes(), aiEnabled()]);
  const templateName = (id: string) => TEMPLATES.find((t) => t.id === id)?.name ?? id;
  return html`
    <section class="grid items-center gap-12 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
      <div class="max-w-xl">
        <p class="m-0 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Folio</p>
        <h1 class="m-0 font-display text-5xl leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">Resumes, <em class="not-italic text-muted-foreground">beautifully</em> built.</h1>
        <p class="m-0 mt-6 max-w-md text-lg text-muted-foreground">Fill in your details, pick one of three templates, and print a clean A4 PDF. No accounts, no clutter.</p>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <a href="/resumes/new" class=${buttonClass({ size: 'lg' })}>Create a resume</a>
          ${sampleForm({ ai, size: 'lg' })}
        </div>
        <p class="m-0 mt-4 text-sm text-muted-foreground">${ai ? 'Samples are written by Claude from a one-line brief.' : 'Samples use built-in content until a Claude credential is configured.'}</p>
      </div>
      <div class="group relative">
        <div class="rounded-2xl border border-border bg-muted/50 p-5 transition-colors group-hover:bg-muted sm:p-8">
          ${sheetThumb(SAMPLE_RESUMES[0].document, 0.56, 'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.35)]')}
        </div>
        <a href="/templates" class="absolute inset-0 rounded-2xl" aria-label="Browse the templates"></a>
      </div>
    </section>

    <section class="grid gap-8 border-t border-border py-12 sm:grid-cols-3">
      ${[
        ['Three templates', 'Classic, Modern and Minimal. Switch any time, keep your content.'],
        ['Live preview', 'Every keystroke updates the page on the right and saves itself.'],
        ['Print-ready PDF', 'A real A4 sheet with print styles, exported from your browser.'],
      ].map(([t, d]) => html`
        <div>
          <h2 class="m-0 text-base font-semibold">${t}</h2>
          <p class="m-0 mt-1 text-sm text-muted-foreground">${d}</p>
        </div>`)}
    </section>

    ${recent.length ? html`
      <section class="border-t border-border py-12">
        ${pageHeader('Recent', undefined, html`<a href="/resumes" class=${buttonClass({ variant: 'ghost', size: 'sm' })}>All resumes</a>`)}
        <ul class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          ${recent.slice(0, 3).map((r) => html`
            <li>
              <a href="/resumes/${r.id}" class="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 no-underline transition-colors hover:bg-accent/50">
                <span class="min-w-0">
                  <span class="block truncate font-medium text-foreground">${r.title}</span>
                  <span class="block truncate text-sm text-muted-foreground">${r.profile.fullName || 'No name yet'} <span aria-hidden="true">·</span> ${timeAgo(r.updatedAt)}</span>
                </span>
                <span class=${badgeClass({ variant: 'outline' })}>${templateName(r.template)}</span>
              </a>
            </li>`)}
        </ul>
      </section>` : ''}
  `;
}
