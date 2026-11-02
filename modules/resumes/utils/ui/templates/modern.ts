import { html } from '@webjsdev/core';
import type { ResumeDocument } from '../../../types.ts';
import { formatDateRange, hrefFor, displayUrl, initials } from '../../format.ts';
import { contactItems, contactLink, hasContent, highlightList, NAME_PLACEHOLDER } from '../parts.ts';

/** Modern: a tinted sidebar for identity, contact, skills and education, a wide column for the story. */
export function modernTemplate(doc: ResumeDocument) {
  const { profile } = doc;
  const has = hasContent(doc);
  const contacts = contactItems(profile);
  const sideTitle = (label: string) => html`<h2 class="m-0 mb-[2mm] text-[8.5px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">${label}</h2>`;
  const mainTitle = (label: string) => html`
    <h2 class="m-0 mb-[2.5mm] flex items-center gap-[2.5mm] text-[9px] font-semibold uppercase tracking-[0.2em] text-paper-muted">
      <span>${label}</span><span aria-hidden="true" class="h-px flex-1 bg-paper-line"></span>
    </h2>`;
  return html`
    <div class="grid min-h-[inherit] grid-cols-[64mm_1fr] font-sans text-[9.5pt] leading-[1.5]">
      <aside class="flex flex-col gap-[6mm] px-[8mm] py-[12mm] [background:color-mix(in_srgb,var(--accent)_7%,white)]">
        <div>
          <div aria-hidden="true" class="mb-[4mm] grid size-[16mm] place-items-center rounded-full bg-[var(--accent)] text-[13pt] font-semibold text-white">${initials(profile.fullName) || '?'}</div>
          <h1 class="m-0 text-[17pt] font-bold leading-[1.1] tracking-[-0.01em]">${profile.fullName || NAME_PLACEHOLDER}</h1>
          ${profile.headline ? html`<p class="m-0 mt-[1.5mm] text-[10pt] font-medium text-[var(--accent)]">${profile.headline}</p>` : ''}
        </div>
        ${contacts.length ? html`
          <div>
            ${sideTitle('Contact')}
            <ul class="m-0 flex list-none flex-col gap-[1mm] p-0 text-[8.5pt] break-words">
              ${contacts.map((c) => html`<li>${contactLink(c)}</li>`)}
            </ul>
          </div>` : ''}
        ${has.skills ? html`
          <div>
            ${sideTitle('Skills')}
            <ul class="m-0 flex list-none flex-wrap gap-[1.2mm] p-0">
              ${doc.skills.map((s) => html`<li class="rounded-[2px] bg-white/70 px-[1.8mm] py-[0.6mm] text-[8pt] font-medium">${s}</li>`)}
            </ul>
          </div>` : ''}
        ${has.education ? html`
          <div>
            ${sideTitle('Education')}
            <div class="flex flex-col gap-[2.5mm] text-[8.5pt]">
              ${doc.education.map((e) => html`
                <div>
                  <p class="m-0 font-semibold">${[e.degree, e.field].filter(Boolean).join(', ') || 'Degree'}</p>
                  <p class="m-0 text-paper-muted">${e.school}</p>
                  <p class="m-0 text-paper-muted">${formatDateRange(e.start, e.end)}</p>
                </div>`)}
            </div>
          </div>` : ''}
      </aside>

      <div class="flex flex-col gap-[6mm] px-[10mm] py-[12mm]">
        ${has.summary ? html`<section>${mainTitle('Profile')}<p class="m-0 text-[10pt]">${profile.summary}</p></section>` : ''}
        ${has.experience ? html`
          <section>
            ${mainTitle('Experience')}
            <div class="flex flex-col gap-[4mm]">
              ${doc.experience.map((e) => html`
                <article>
                  <div class="flex items-baseline justify-between gap-[4mm]">
                    <h3 class="m-0 text-[11pt] font-semibold">${e.role || 'Role'}</h3>
                    <span class="shrink-0 text-[8.5pt] text-paper-muted">${formatDateRange(e.start, e.end, e.current)}</span>
                  </div>
                  <p class="m-0 text-[9.5pt] font-medium text-[var(--accent)]">${[e.company, e.location].filter(Boolean).join(' · ')}</p>
                  ${highlightList(e.highlights, 'mt-[1.5mm]')}
                </article>`)}
            </div>
          </section>` : ''}
        ${has.projects ? html`
          <section>
            ${mainTitle('Projects')}
            <div class="flex flex-col gap-[3mm]">
              ${doc.projects.map((p) => html`
                <article>
                  <h3 class="m-0 text-[10pt] font-semibold">${p.name || 'Project'}${p.link ? html` <a href=${hrefFor(p.link)} class="ml-[1mm] text-[8.5pt] font-normal text-paper-muted no-underline">${displayUrl(p.link)}</a>` : ''}</h3>
                  ${p.description ? html`<p class="m-0">${p.description}</p>` : ''}
                </article>`)}
            </div>
          </section>` : ''}
      </div>
    </div>
  `;
}
