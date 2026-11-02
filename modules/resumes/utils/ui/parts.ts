// Fragments shared by the three templates. SSR-time html, no client runtime.
import { html } from '@webjsdev/core';
import type { Profile, ResumeDocument } from '../../types.ts';
import { displayUrl, hrefFor, toHighlights } from '../format.ts';

export function contactItems(profile: Profile) {
  const items: Array<{ label: string; href?: string }> = [];
  if (profile.email) items.push({ label: profile.email, href: `mailto:${profile.email}` });
  if (profile.phone) items.push({ label: profile.phone });
  if (profile.location) items.push({ label: profile.location });
  if (profile.website) items.push({ label: displayUrl(profile.website), href: hrefFor(profile.website) });
  return items;
}

export function contactLink(item: { label: string; href?: string }, cls = '') {
  return item.href
    ? html`<a href=${item.href} class="no-underline text-inherit ${cls}">${item.label}</a>`
    : html`<span class=${cls}>${item.label}</span>`;
}

export function highlightList(text: string, cls = '') {
  const lines = toHighlights(text);
  if (!lines.length) return '';
  return html`<ul class="m-0 list-disc pl-[1.1em] ${cls}">${lines.map((line) => html`<li class="pl-[0.15em]">${line}</li>`)}</ul>`;
}

export function hasContent(doc: ResumeDocument) {
  return {
    summary: Boolean(doc.profile.summary.trim()),
    experience: doc.experience.some((e) => e.company || e.role || e.highlights),
    education: doc.education.some((e) => e.school || e.degree),
    projects: doc.projects.some((p) => p.name || p.description),
    skills: doc.skills.length > 0,
  };
}

export const NAME_PLACEHOLDER = 'Your name';
