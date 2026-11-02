import { defineRelations } from 'drizzle-orm';
import { table, uuidPk, text, json, createdAt, updatedAt } from './columns.server.ts';
import type { Profile, ExperienceEntry, EducationEntry, ProjectEntry, TemplateId } from '#modules/resumes/types.ts';

// One row per resume. The sections are JSON columns rather than child tables:
// a resume is always edited and rendered as one document, so the whole thing
// travels together and every write replaces one section wholesale.
export const resumes = table('resumes', {
  id: uuidPk(),
  // The internal name shown in the list ("Backend roles 2026"), never printed.
  title: text().notNull(),
  template: text().$type<TemplateId>().notNull().default('classic'),
  // A hex colour from the ACCENTS palette in modules/resumes/types.ts.
  accent: text().notNull().default('#1c1b19'),
  profile: json<Profile>().notNull(),
  experience: json<ExperienceEntry[]>().notNull(),
  education: json<EducationEntry[]>().notNull(),
  projects: json<ProjectEntry[]>().notNull(),
  skills: json<string[]>().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const relations = defineRelations({ resumes }, () => ({}));

// Derived types, never hand-written.
export type ResumeRow = typeof resumes.$inferSelect;
export type ResumeInsert = typeof resumes.$inferInsert;
