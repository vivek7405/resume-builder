import { html } from '@webjsdev/core';
import type { ResumeDocument } from '../../../types.ts';
import { formatDateRange, hrefFor, displayUrl } from '../../format.ts';
import { contactItems, contactLink, hasContent, highlightList, NAME_PLACEHOLDER } from '../parts.ts';

/** Minimal: sans type, generous whitespace, labels in a narrow left column, one accent line. */
export function minimalTemplate(doc: ResumeDocument) {
  const { profile } = doc;
  const has = hasContent(doc);
  const contacts = contactItems(profile);
  const row = (label: string, body: unknown) => html`
    <section class="grid grid-cols-[34mm_1fr] gap-[6mm]">
      <h2 class="m-0 pt-[0.5mm] text-[8.5px] font-semibold uppercase tracking-[0.22em] text-paper-muted">${label}</h2>
      <div>${body}</div>
    </section>`;
  return html`
    <div class="font-sans text-[10pt] font-normal leading-[1.55]">
      <header class="mb-[9mm]">
        <h1 class="m-0 text-[28pt] font-semibold leading-[1.05] tracking-[-0.02em]">${profile.fullName || NAME_PLACEHOLDER}</h1>
        <div aria-hidden="true" class="mt-[3mm] h-[2px] w-[14mm] bg-[var(--accent)]"></div>
        <div class="mt-[3mm] flex flex-wrap items-baseline justify-between gap-x-[6mm] gap-y-[1mm]">
          ${profile.headline ? html`<p class="m-0 text-[11pt] font-medium">${profile.headline}</p>` : ''}
          ${contacts.length ? html`<p class="m-0 flex flex-wrap gap-x-[3mm] text-[8.5pt] text-paper-muted">${contacts.map((c) => contactLink(c))}</p>` : ''}
        </div>
      </header>

      <div class="flex flex-col gap-[7mm]">
        ${has.summary ? row('About', html`<p class="m-0">${profile.summary}</p>`) : ''}
        ${has.experience ? row('Experience', html`
          <div class="flex flex-col gap-[4.5mm]">
            ${doc.experience.map((e) => html`
              <article>
                <div class="flex items-baseline justify-between gap-[4mm]">
                  <h3 class="m-0 text-[10.5pt] font-semibold">${e.role || 'Role'}${e.company ? html`<span class="font-normal text-paper-muted"> at ${e.company}</span>` : ''}</h3>
                  <span class="shrink-0 text-[8.5pt] tabular-nums text-paper-muted">${formatDateRange(e.start, e.end, e.current)}</span>
                </div>
                ${highlightList(e.highlights, 'mt-[1.2mm] text-[9.5pt]')}
              </article>`)}
          </div>`) : ''}
        ${has.projects ? row('Projects', html`
          <div class="flex flex-col gap-[3mm]">
            ${doc.projects.map((p) => html`
              <article>
                <h3 class="m-0 text-[10pt] font-semibold">${p.name || 'Project'}${p.link ? html` <a href=${hrefFor(p.link)} class="ml-[1mm] text-[8.5pt] font-normal text-paper-muted no-underline">${displayUrl(p.link)}</a>` : ''}</h3>
                ${p.description ? html`<p class="m-0 text-[9.5pt]">${p.description}</p>` : ''}
              </article>`)}
          </div>`) : ''}
        ${has.education ? row('Education', html`
          <div class="flex flex-col gap-[3mm]">
            ${doc.education.map((e) => html`
              <article class="flex items-baseline justify-between gap-[4mm]">
                <div>
                  <h3 class="m-0 text-[10pt] font-semibold">${e.school || 'School'}</h3>
                  <p class="m-0 text-[9.5pt] text-paper-muted">${[e.degree, e.field].filter(Boolean).join(', ')}${e.notes ? ` · ${e.notes}` : ''}</p>
                </div>
                <span class="shrink-0 text-[8.5pt] tabular-nums text-paper-muted">${formatDateRange(e.start, e.end)}</span>
              </article>`)}
          </div>`) : ''}
        ${has.skills ? row('Skills', html`<p class="m-0 text-[9.5pt]">${doc.skills.join(', ')}</p>`) : ''}
      </div>
    </div>
  `;
}
