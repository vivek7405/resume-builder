import { html } from '@webjsdev/core';
import type { Metadata, PageProps } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { badgeClass } from '#components/ui/badge.ts';
import { inputClass } from '#components/ui/input.ts';
import { nativeSelectClass, nativeSelectIconClass, nativeSelectWrapperClass } from '#components/ui/native-select.ts';
import { emptyClass, emptyContentClass, emptyDescriptionClass, emptyHeaderClass, emptyTitleClass } from '#components/ui/empty.ts';
import { cn } from '#lib/utils/cn.ts';
import { pageHeader, sampleForm, sheetThumb } from '#lib/utils/ui.ts';
import '#components/fit-sheet.ts';
import '#components/form-pending.ts';
import { listResumes, type ResumeSort } from '#modules/resumes/queries/list-resumes.server.ts';
import { aiEnabled } from '#modules/resumes/queries/ai-status.server.ts';
import { TEMPLATES } from '#modules/resumes/types.ts';
import { timeAgo } from '#modules/resumes/utils/format.ts';

export const metadata: Metadata = { title: 'Resumes | Folio' };

export default async function Resumes({ searchParams }: PageProps<'/resumes'>) {
  const q = String(searchParams.q ?? '').trim();
  const sort: ResumeSort = searchParams.sort === 'title' ? 'title' : 'updated';
  const [rows, ai] = await Promise.all([listResumes({ q, sort }), aiEnabled()]);
  const templateName = (id: string) => TEMPLATES.find((t) => t.id === id)?.name ?? id;
  return html`
    ${pageHeader('Resumes', `${rows.length} ${rows.length === 1 ? 'resume' : 'resumes'}${q ? ` matching "${q}"` : ''}`, html`
      ${sampleForm({ ai, size: 'sm' })}
      <a href="/resumes/new" class=${buttonClass({ size: 'sm' })}>New resume</a>
    `)}

    <form method="get" action="/resumes" class="mb-8 flex flex-wrap items-center gap-2" role="search">
      <label class="sr-only" for="q">Search resumes</label>
      <input id="q" name="q" type="search" value=${q} placeholder="Search by name or title" class="${inputClass()} max-w-xs">
      <label class="sr-only" for="sort">Sort</label>
      <div class=${nativeSelectWrapperClass()}>
        <select id="sort" name="sort" class=${nativeSelectClass()}>
          <option value="updated" ?selected=${sort === 'updated'}>Recently edited</option>
          <option value="title" ?selected=${sort === 'title'}>By title</option>
        </select>
        <svg class=${nativeSelectIconClass()} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <button type="submit" class=${buttonClass({ variant: 'secondary' })}>Search</button>
      ${q ? html`<a href="/resumes" class=${buttonClass({ variant: 'ghost' })}>Clear</a>` : ''}
    </form>

    ${rows.length === 0 ? html`
      <div class=${cn(emptyClass(), 'border')} role=${q ? 'status' : null}>
        <div class=${emptyHeaderClass()}>
          <h2 class=${emptyTitleClass()}>${q ? 'Nothing matches' : 'No resumes yet'}</h2>
          <p class=${emptyDescriptionClass()}>${q ? 'Try another name or clear the search.' : 'Start from a blank page or generate a complete sample to see what Folio produces.'}</p>
        </div>
        <div class=${emptyContentClass()}>
          <div class="flex flex-wrap justify-center gap-2">
            <a href="/resumes/new" class=${buttonClass()}>Create a resume</a>
            ${sampleForm({ ai })}
          </div>
        </div>
      </div>` : html`
      <ul class="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        ${rows.map((r) => html`
          <li class="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow] hover:border-border-strong">
            <div class="border-b border-border bg-muted/60 p-4 transition-colors group-hover:bg-muted">
              ${sheetThumb(r, 0.42, 'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_30px_-16px_rgba(0,0,0,0.35)]')}
            </div>
            <div class="flex items-start justify-between gap-3 p-4">
              <div class="min-w-0">
                <h2 class="m-0 truncate text-base font-semibold">
                  <a href="/resumes/${r.id}" class="text-foreground no-underline after:absolute after:inset-0 after:content-['']">${r.title}</a>
                </h2>
                <p class="m-0 mt-0.5 truncate text-sm text-muted-foreground">${r.profile.fullName || 'No name yet'}${r.profile.headline ? html` <span aria-hidden="true">·</span> ${r.profile.headline}` : ''}</p>
                <p class="m-0 mt-2 text-xs text-muted-foreground">Edited ${timeAgo(r.updatedAt)}</p>
              </div>
              <span class="${badgeClass({ variant: 'outline' })} shrink-0">${templateName(r.template)}</span>
            </div>
          </li>`)}
      </ul>`}
  `;
}
