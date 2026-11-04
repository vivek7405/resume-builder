// Browser-safe types and catalogues for the resumes feature. No runtime import
// from a .server.ts file: the row type below is a type-only derivation, erased
// before this module reaches the browser.
import type { resumes } from '#db/schema.server.ts';

export const TEMPLATES = [
  { id: 'classic', name: 'Classic', blurb: 'Serif type, a centred header and hairline rules. Timeless.' },
  { id: 'modern', name: 'Modern', blurb: 'Two columns with a tinted sidebar for contact and skills.' },
  { id: 'minimal', name: 'Minimal', blurb: 'Sans type, generous whitespace, one accent line.' },
] as const;
export type TemplateId = (typeof TEMPLATES)[number]['id'];

export const ACCENTS = [
  { id: 'ink', name: 'Ink', hex: '#1c1b19' },
  { id: 'indigo', name: 'Indigo', hex: '#3b4fd9' },
  { id: 'teal', name: 'Teal', hex: '#0f766e' },
  { id: 'rust', name: 'Rust', hex: '#b4531f' },
  { id: 'plum', name: 'Plum', hex: '#7a2e6b' },
  { id: 'moss', name: 'Moss', hex: '#4d6b2f' },
  { id: 'crimson', name: 'Crimson', hex: '#a3243b' },
] as const;

export interface Profile {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  location: string;
  // Months as 'YYYY-MM' (the native month input's value), or ''.
  start: string;
  end: string;
  current: boolean;
  // One highlight per line.
  highlights: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  notes: string;
}

export interface ProjectEntry {
  name: string;
  link: string;
  description: string;
}

export type ResumeData = typeof resumes.$inferSelect;

/** The document part of a resume: what the templates render. */
export type ResumeDocument = Pick<ResumeData, 'template' | 'accent' | 'profile' | 'experience' | 'education' | 'projects' | 'skills'>;

export type ListSection = 'experience' | 'education' | 'projects';
export const LIST_SECTIONS: readonly ListSection[] = ['experience', 'education', 'projects'];

export type SectionEntry<S extends ListSection> =
  S extends 'experience' ? ExperienceEntry : S extends 'education' ? EducationEntry : ProjectEntry;

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}

export function isListSection(value: string): value is ListSection {
  return (LIST_SECTIONS as readonly string[]).includes(value);
}

export function emptyProfile(): Profile {
  return { fullName: '', headline: '', email: '', phone: '', location: '', website: '', summary: '' };
}

export function emptyEntry<S extends ListSection>(section: S): SectionEntry<S> {
  const entry: ExperienceEntry | EducationEntry | ProjectEntry =
    section === 'experience'
      ? { company: '', role: '', location: '', start: '', end: '', current: false, highlights: '' }
      : section === 'education'
        ? { school: '', degree: '', field: '', start: '', end: '', notes: '' }
        : { name: '', link: '', description: '' };
  return entry as SectionEntry<S>;
}

export function emptyDocument(template: TemplateId = 'classic'): ResumeDocument {
  return { template, accent: ACCENTS[0].hex, profile: emptyProfile(), experience: [], education: [], projects: [], skills: [] };
}
