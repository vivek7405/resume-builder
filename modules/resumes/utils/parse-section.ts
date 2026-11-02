// FormData to section objects. Browser-safe and pure: the server validators
// and the draft island both run this, so what the preview shows while typing
// is exactly what the action stores.
import { ACCENTS, isTemplateId, type EducationEntry, type ExperienceEntry, type ListSection, type Profile, type ProjectEntry, type SectionEntry, type TemplateId } from '../types.ts';
import { skillsFromText } from './format.ts';

const LIMITS = { short: 120, long: 4000 } as const;

function field(fd: FormData, name: string, max: number = LIMITS.short): string {
  const value = fd.get(name);
  return (typeof value === 'string' ? value : '').trim().slice(0, max);
}

function month(fd: FormData, name: string): string {
  const value = field(fd, name, 7);
  return /^\d{4}-\d{2}$/.test(value) ? value : '';
}

export function profileFromForm(fd: FormData): Profile {
  return {
    fullName: field(fd, 'fullName'),
    headline: field(fd, 'headline'),
    email: field(fd, 'email'),
    phone: field(fd, 'phone', 40),
    location: field(fd, 'location'),
    website: field(fd, 'website', 200),
    summary: field(fd, 'summary', LIMITS.long),
  };
}

export interface Settings { title: string; template: TemplateId; accent: string }

export function settingsFromForm(fd: FormData): Settings {
  const template = field(fd, 'template', 20);
  const accent = field(fd, 'accent', 7).toLowerCase();
  return {
    title: field(fd, 'title'),
    template: isTemplateId(template) ? template : 'classic',
    accent: ACCENTS.some((a) => a.hex === accent) ? accent : ACCENTS[0].hex,
  };
}

export function skillsFromForm(fd: FormData): string[] {
  return skillsFromText(field(fd, 'skills', LIMITS.long));
}

export function entryFromForm<S extends ListSection>(section: S, fd: FormData): SectionEntry<S> {
  let entry: ExperienceEntry | EducationEntry | ProjectEntry;
  if (section === 'experience') {
    entry = {
      company: field(fd, 'company'),
      role: field(fd, 'role'),
      location: field(fd, 'location'),
      start: month(fd, 'start'),
      end: month(fd, 'end'),
      current: fd.get('current') === 'on' || fd.get('current') === 'true',
      highlights: field(fd, 'highlights', LIMITS.long),
    };
  } else if (section === 'education') {
    entry = {
      school: field(fd, 'school'),
      degree: field(fd, 'degree'),
      field: field(fd, 'field'),
      start: month(fd, 'start'),
      end: month(fd, 'end'),
      notes: field(fd, 'notes', LIMITS.long),
    };
  } else {
    entry = {
      name: field(fd, 'name'),
      link: field(fd, 'link', 200),
      description: field(fd, 'description', LIMITS.long),
    };
  }
  return entry as SectionEntry<S>;
}

/** The common envelope every editor form carries. */
export function targetFromForm(fd: FormData): { resumeId: string; section: string; index: number } {
  const index = Number.parseInt(field(fd, 'index', 6), 10);
  return {
    resumeId: field(fd, 'resumeId', 64),
    section: field(fd, 'section', 20),
    index: Number.isInteger(index) && index >= 0 ? index : 0,
  };
}
