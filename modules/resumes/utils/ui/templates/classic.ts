import { html } from '@webjsdev/core';
import type { ResumeDocument } from '../../../types.ts';
import { formatDateRange, hrefFor, displayUrl } from '../../format.ts';
import { contactItems, contactLink, hasContent, highlightList, NAME_PLACEHOLDER } from '../parts.ts';

/** Classic: serif type, a centred header, hairline rules. */
export function classicTemplate(doc: ResumeDocument) {
  const { profile } = doc;
  const has = hasContent(doc);
  const contacts = contactItems(profile);
  const section = (label: string) => html`
    <h2 class="m-0 mb-[2.2mm] border-b border-paper-line pb-[1.2mm] font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">${label}</h2>`;
  return html`
    <div class="font-serif text-[10.5pt] leading-[1.45]">
      <header class="mb-[7mm] text-center">
        <h1 class="m-0 text-[26pt] font-semibold leading-[1.1] tracking-[-0.01em]">${profile.fullName || NAME_PLACEHOLDER}</h1>
        ${profile.headline ? html`<p class="m-0 mt-[1.5mm] text-[11.5pt] italic text-paper-muted">${profile.headline}</p>` : ''}
        ${contacts.length ? html`
          <p class="m-0 mt-[2.5mm] flex flex-wrap justify-center gap-x-[3mm] gap-y-[0.5mm] font-sans text-[8.5pt] text-paper-muted">
            ${contacts.map((c, i) => html`${i > 0 ? html`<span aria-hidden="true" class="text-paper-line">|</span>` : ''}${contactLink(c)}`)}
          </p>` : ''}
      </header>

      ${has.summary ? html`<section class="mb-[6mm]">${section('Summary')}<p class="m-0">${profile.summary}</p></section>` : ''}

      ${has.experience ? html`
        <section class="mb-[6mm]">
          ${section('Experience')}
          <div class="flex flex-col gap-[3.5mm]">
            ${doc.experience.map((e) => html`
              <article>
                <div class="flex items-baseline justify-between gap-[4mm]">
                  <h3 class="m-0 text-[11pt] font-semibold">${e.role || 'Role'}${e.company ? html`<span class="font-normal text-paper-muted">, ${e.company}</span>` : ''}</h3>
                  <span class="shrink-0 font-sans text-[8.5pt] text-paper-muted">${formatDateRange(e.start, e.end, e.current)}</span>
                </div>
                ${e.location ? html`<p class="m-0 font-sans text-[8.5pt] text-paper-muted">${e.location}</p>` : ''}
                ${highlightList(e.highlights, 'mt-[1.2mm]')}
              </article>`)}
          </div>
        </section>` : ''}

      ${has.projects ? html`
        <section class="mb-[6mm]">
          ${section('Projects')}
          <div class="flex flex-col gap-[2.5mm]">
            ${doc.projects.map((p) => html`
              <article>
                <h3 class="m-0 text-[10.5pt] font-semibold">${p.name || 'Project'}${p.link ? html` <a href=${hrefFor(p.link)} class="ml-[1mm] font-sans text-[8.5pt] font-normal text-paper-muted no-underline">${displayUrl(p.link)}</a>` : ''}</h3>
                ${p.description ? html`<p class="m-0">${p.description}</p>` : ''}
              </article>`)}
          </div>
        </section>` : ''}

      ${has.education ? html`
        <section class="mb-[6mm]">
          ${section('Education')}
          <div class="flex flex-col gap-[2.5mm]">
            ${doc.education.map((e) => html`
              <article>
                <div class="flex items-baseline justify-between gap-[4mm]">
                  <h3 class="m-0 text-[10.5pt] font-semibold">${[e.degree, e.field].filter(Boolean).join(' in ') || 'Degree'}<span class="font-normal text-paper-muted">${e.school ? `, ${e.school}` : ''}</span></h3>
                  <span class="shrink-0 font-sans text-[8.5pt] text-paper-muted">${formatDateRange(e.start, e.end)}</span>
                </div>
                ${e.notes ? html`<p class="m-0 text-paper-muted">${e.notes}</p>` : ''}
              </article>`)}
          </div>
        </section>` : ''}

      ${has.skills ? html`
        <section>
          ${section('Skills')}
          <p class="m-0">${doc.skills.join('  ·  ')}</p>
        </section>` : ''}
    </div>
  `;
}
