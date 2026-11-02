import { html, notFound } from '@webjsdev/core';
import type { Metadata, MetadataContext, PageProps } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';
import { badgeClass } from '#components/ui/badge.ts';
import { cn } from '#lib/utils/cn.ts';
import { getResume } from '#modules/resumes/queries/get-resume.server.ts';
import { updateProfile } from '#modules/resumes/actions/update-profile.server.ts';
import { updateSettings } from '#modules/resumes/actions/update-settings.server.ts';
import { updateSkills } from '#modules/resumes/actions/update-skills.server.ts';
import { saveEntry } from '#modules/resumes/actions/save-entry.server.ts';
import { addEntry } from '#modules/resumes/actions/add-entry.server.ts';
import { removeEntry } from '#modules/resumes/actions/remove-entry.server.ts';
import { moveEntry } from '#modules/resumes/actions/move-entry.server.ts';
import { duplicateResume } from '#modules/resumes/actions/duplicate-resume.server.ts';
import { ACCENTS, TEMPLATES, type ListSection, type ResumeData } from '#modules/resumes/types.ts';
import { hidden, textArea, textField } from '#modules/resumes/utils/ui/editor-fields.ts';
import '#modules/resumes/components/resume-preview.ts';
import '#modules/resumes/components/draft-form.ts';

export async function generateMetadata({ params }: MetadataContext): Promise<Metadata> {
  const resume = await getResume(String(params.id));
  return { title: resume ? `${resume.title} | Folio` : 'Resume | Folio', robots: { index: false } };
}

type ActionData = { fieldErrors?: Record<string, string>; values?: Record<string, string>; error?: string };

const SECTION_META: Record<ListSection, { title: string; blurb: string; add: string; label: (e: Record<string, string>) => string }> = {
  experience: { title: 'Experience', blurb: 'Most recent first. One achievement per line, with a number where you can.', add: 'Add a role', label: (e) => [e.role, e.company].filter(Boolean).join(' at ') },
  education: { title: 'Education', blurb: 'Degrees, bootcamps, certifications.', add: 'Add education', label: (e) => [e.degree, e.school].filter(Boolean).join(', ') },
  projects: { title: 'Projects', blurb: 'Side projects, open source, talks. Keep each to one sentence.', add: 'Add a project', label: (e) => e.name },
};

export default async function Editor({ params, searchParams, actionData }: PageProps<'/resumes/[id]'> & { actionData?: ActionData }) {
  const resume = await getResume(params.id);
  if (!resume) notFound();
  const failed = actionData?.values ?? {};
  const errors = actionData?.fieldErrors ?? {};
  // Errors belong to the form whose submission failed, identified by its hidden envelope.
  const errorFor = (section: string, index = 0) => (failed.section === section && Number(failed.index ?? 0) === index ? errors : {});
  // A failed submission re-renders at 422 with what was typed, so the user fixes one field instead of retyping.
  const valueFor = (section: string, index: number, key: string, saved: string) =>
    failed.section === section && Number(failed.index ?? 0) === index && key in failed ? String(failed[key]) : saved;
  const sample = String(searchParams.sample ?? '');
  const templateName = TEMPLATES.find((t) => t.id === resume.template)?.name ?? resume.template;
  const envelope = (section: string, index = 0) => html`${hidden('resumeId', resume.id)}${hidden('section', section)}${hidden('index', index)}`;

  const sectionShell = (id: string, title: string, blurb: string, body: unknown) => html`
    <section id=${id} class="scroll-mt-24">
      <div class="mb-4">
        <h2 class="m-0 text-lg font-semibold tracking-tight">${title}</h2>
        <p class="m-0 mt-0.5 text-sm text-muted-foreground">${blurb}</p>
      </div>
      ${body}
    </section>`;

  const card = (body: unknown, cls = '') => html`<div class="rounded-2xl border border-border bg-card p-5 ${cls}">${body}</div>`;

  const saveRow = (label = 'Save') => html`
    <div class="mt-5 flex items-center justify-end gap-2">
      <button type="submit" class=${buttonClass({ variant: 'secondary', size: 'sm' })}>${label}</button>
    </div>`;

  const listSection = (section: ListSection) => {
    const meta = SECTION_META[section];
    const entries = resume[section] as unknown as Array<Record<string, string | boolean>>;
    return sectionShell(section, meta.title, meta.blurb, html`
      <div class="flex flex-col gap-4">
        ${entries.map((entry, index) => {
          const e = errorFor(section, index);
          const p = `${section}-${index}`;
          const str = (k: string) => valueFor(section, index, k, String(entry[k] ?? ''));
          const label = meta.label(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, String(v)]))) || `${meta.title} ${index + 1}`;
          const mini = (action: typeof moveEntry | typeof removeEntry, extra: unknown, aria: string, icon: unknown, disabled = false) => html`
            <form action=${action} class="contents">
              ${envelope(section, index)}${extra}
              <button type="submit" class=${cn(buttonClass({ variant: 'ghost', size: 'icon-xs' }), 'text-muted-foreground')} aria-label=${aria} ?disabled=${disabled}>${icon}</button>
            </form>`;
          return html`
            <div id=${p} class="scroll-mt-24 rounded-2xl border border-border bg-card">
              <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <h3 class="m-0 truncate text-sm font-medium">${label}</h3>
                <div class="flex shrink-0 items-center gap-1">
                  ${mini(moveEntry, hidden('direction', 'up'), 'Move up', ICON.up, index === 0)}
                  ${mini(moveEntry, hidden('direction', 'down'), 'Move down', ICON.down, index === entries.length - 1)}
                  ${mini(removeEntry, '', 'Remove', ICON.remove)}
                </div>
              </div>
              <draft-form section=${section} index=${index} class="block p-5">
                <form action=${saveEntry}>
                  ${envelope(section, index)}
                  ${section === 'experience' ? html`
                    <div class="grid gap-4 sm:grid-cols-2">
                      ${textField({ id: `${p}-role`, name: 'role', label: 'Role', value: str('role'), error: e.role, placeholder: 'Senior Backend Engineer', autocomplete: 'organization-title' })}
                      ${textField({ id: `${p}-company`, name: 'company', label: 'Company', value: str('company'), placeholder: 'Lumen Pay', autocomplete: 'organization' })}
                      ${textField({ id: `${p}-location`, name: 'location', label: 'Location', value: str('location'), placeholder: 'London' })}
                      <div class="grid grid-cols-2 gap-4">
                        ${textField({ id: `${p}-start`, name: 'start', label: 'Start', value: str('start'), type: 'month', placeholder: 'YYYY-MM' })}
                        ${textField({ id: `${p}-end`, name: 'end', label: 'End', value: str('end'), type: 'month', placeholder: 'YYYY-MM', disabled: entry.current === true })}
                      </div>
                    </div>
                    <label class="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="current" class="size-4 accent-[var(--primary)]" ?checked=${entry.current === true}> I work here now</label>
                    ${textArea({ id: `${p}-highlights`, name: 'highlights', label: 'Highlights', value: str('highlights'), rows: 4, cls: 'mt-4', hint: 'One per line. Lead with the outcome.' })}`
                  : section === 'education' ? html`
                    <div class="grid gap-4 sm:grid-cols-2">
                      ${textField({ id: `${p}-school`, name: 'school', label: 'School', value: str('school'), placeholder: 'University of Edinburgh' })}
                      ${textField({ id: `${p}-degree`, name: 'degree', label: 'Degree', value: str('degree'), placeholder: 'BSc' })}
                      ${textField({ id: `${p}-field`, name: 'field', label: 'Field', value: str('field'), placeholder: 'Computer Science' })}
                      <div class="grid grid-cols-2 gap-4">
                        ${textField({ id: `${p}-start`, name: 'start', label: 'Start', value: str('start'), type: 'month', placeholder: 'YYYY-MM' })}
                        ${textField({ id: `${p}-end`, name: 'end', label: 'End', value: str('end'), type: 'month', placeholder: 'YYYY-MM' })}
                      </div>
                    </div>
                    ${textArea({ id: `${p}-notes`, name: 'notes', label: 'Notes', value: str('notes'), rows: 2, cls: 'mt-4', hint: 'Honours, thesis, relevant coursework. Optional.' })}`
                  : html`
                    <div class="grid gap-4 sm:grid-cols-2">
                      ${textField({ id: `${p}-name`, name: 'name', label: 'Name', value: str('name'), placeholder: 'ledgerkit' })}
                      ${textField({ id: `${p}-link`, name: 'link', label: 'Link', value: str('link'), type: 'text', placeholder: 'github.com/you/project' })}
                    </div>
                    ${textArea({ id: `${p}-description`, name: 'description', label: 'Description', value: str('description'), rows: 2, cls: 'mt-4' })}`}
                  ${saveRow()}
                </form>
              </draft-form>
            </div>`;
        })}
        <form action=${addEntry}>
          ${envelope(section)}${hidden('add', section)}
          <button type="submit" class=${buttonClass({ variant: 'outline', size: 'sm' })}>${ICON.plus} ${meta.add}</button>
        </form>
      </div>`);
  };

  const pe = errorFor('profile');
  const se = errorFor('settings');

  return html`
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <a href="/resumes" class="text-sm text-muted-foreground no-underline hover:text-foreground">Resumes</a>
        <span class="text-sm text-muted-foreground" aria-hidden="true"> / </span>
        <h1 class="m-0 mt-1 flex items-center gap-3 text-2xl font-semibold tracking-tight">
          <span class="truncate">${resume.title}</span>
          <span class="${badgeClass({ variant: 'outline' })} shrink-0">${templateName}</span>
        </h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <form action=${duplicateResume}>
          ${hidden('resumeId', resume.id)}
          <button type="submit" class=${buttonClass({ variant: 'ghost', size: 'sm' })}>Duplicate</button>
        </form>
        <a href="/resumes/${resume.id}/delete" class="${buttonClass({ variant: 'ghost', size: 'sm' })} text-muted-foreground hover:text-destructive">Delete</a>
        <a href="/resumes/${resume.id}/export" download data-no-router class=${buttonClass({ variant: 'outline', size: 'sm' })}>Export JSON</a>
        <a href="/resumes/${resume.id}/preview" class=${buttonClass({ size: 'sm' })}>${ICON.print} Preview and print</a>
      </div>
    </div>

    ${sample ? html`
      <div class="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm" role="status">
        ${ICON.sparkle}
        <p class="m-0">This is a sample resume. Everything in it is fictional. Edit anything, or delete it and start fresh.</p>
      </div>` : ''}
    ${actionData?.error ? html`<p class="mb-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">${actionData.error}</p>` : ''}

    <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div class="flex flex-col gap-10">
        ${sectionShell('profile', 'Profile', 'Who you are and how to reach you.', card(html`
          <draft-form section="profile" class="block">
            <form action=${updateProfile}>
              ${envelope('profile')}
              <div class="grid gap-4 sm:grid-cols-2">
                ${textField({ id: 'fullName', name: 'fullName', label: 'Full name', value: valueFor('profile', 0, 'fullName', resume.profile.fullName), placeholder: 'Maya Okafor', autocomplete: 'name' })}
                ${textField({ id: 'headline', name: 'headline', label: 'Headline', value: valueFor('profile', 0, 'headline', resume.profile.headline), placeholder: 'Senior Backend Engineer' })}
                ${textField({ id: 'email', name: 'email', label: 'Email', value: valueFor('profile', 0, 'email', resume.profile.email), type: 'email', error: pe.email, placeholder: 'you@example.com', autocomplete: 'email' })}
                ${textField({ id: 'phone', name: 'phone', label: 'Phone', value: valueFor('profile', 0, 'phone', resume.profile.phone), type: 'tel', placeholder: '+44 7700 900123', autocomplete: 'tel' })}
                ${textField({ id: 'location', name: 'location', label: 'Location', value: valueFor('profile', 0, 'location', resume.profile.location), placeholder: 'London, UK' })}
                ${textField({ id: 'website', name: 'website', label: 'Website', value: valueFor('profile', 0, 'website', resume.profile.website), placeholder: 'you.dev', autocomplete: 'url' })}
              </div>
              ${textArea({ id: 'summary', name: 'summary', label: 'Summary', value: valueFor('profile', 0, 'summary', resume.profile.summary), rows: 4, cls: 'mt-4', hint: 'Two or three sentences. What you do, what you are known for.' })}
              ${saveRow()}
            </form>
          </draft-form>`))}

        ${listSection('experience')}
        ${listSection('education')}
        ${listSection('projects')}

        ${sectionShell('skills', 'Skills', 'Separate with commas or new lines.', card(html`
          <draft-form section="skills" class="block">
            <form action=${updateSkills}>
              ${envelope('skills')}
              ${textArea({ id: 'skills', name: 'skills', label: 'Skills', value: valueFor('skills', 0, 'skills', resume.skills.join(', ')), rows: 3, placeholder: 'Go, TypeScript, PostgreSQL' })}
              ${saveRow()}
            </form>
          </draft-form>`))}

        ${sectionShell('settings', 'Settings', 'The name is for you. The template and accent shape the printed page.', card(html`
          <draft-form section="settings" class="block">
            <form action=${updateSettings}>
              ${envelope('settings')}
              ${textField({ id: 'title', name: 'title', label: 'Resume name', value: valueFor('settings', 0, 'title', resume.title), error: se.title })}
              <fieldset class="m-0 mt-5 border-0 p-0">
                <legend class="mb-2 text-sm font-medium">Template</legend>
                <div class="grid grid-cols-3 gap-2">
                  ${TEMPLATES.map((t) => html`
                    <label class="cursor-pointer rounded-xl border border-border px-3 py-2.5 text-center text-sm transition-colors hover:border-border-strong has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background">
                      <input type="radio" name="template" value=${t.id} ?checked=${resume.template === t.id} class="sr-only">${t.name}
                    </label>`)}
                </div>
              </fieldset>
              <fieldset class="m-0 mt-5 border-0 p-0">
                <legend class="mb-2 text-sm font-medium">Accent</legend>
                <div class="flex flex-wrap gap-2">
                  ${ACCENTS.map((a) => html`
                    <label class="group relative cursor-pointer" title=${a.name}>
                      <input type="radio" name="accent" value=${a.hex} ?checked=${resume.accent === a.hex} class="peer sr-only" aria-label=${a.name}>
                      <span class="block size-8 rounded-full border-2 border-transparent ring-2 ring-transparent transition-shadow peer-checked:ring-foreground peer-focus-visible:ring-ring" style="background: ${a.hex}; border-color: var(--background)"></span>
                    </label>`)}
                </div>
              </fieldset>
              ${saveRow()}
            </form>
          </draft-form>`))}
      </div>

      <div class="min-w-0">
        <div class="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:max-h-[calc(100dvh-var(--header-h)-3rem)] lg:overflow-y-auto">
          <p class="m-0 mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
          <resume-preview .resume=${resume} scale="0.62"></resume-preview>
        </div>
      </div>
    </div>
  `;
}

const ICON = {
  up: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`,
  down: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`,
  remove: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  plus: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  print: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/></svg>`,
  sparkle: html`<svg class="mt-0.5 size-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 19l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>`,
};
