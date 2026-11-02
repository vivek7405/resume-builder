// Server-only helpers shared by the actions (no 'use server': reached only
// from actions and queries, never imported by a page or a component).
import { eq } from 'drizzle-orm';
import { db } from '#db/connection.server.ts';
import { resumes, type ResumeRow } from '#db/schema.server.ts';
import type { ListSection, SectionEntry } from '../types.ts';

export async function findResume(id: string): Promise<ResumeRow | null> {
  if (!id) return null;
  const row = await db.query.resumes.findFirst({ where: { id } });
  return row ?? null;
}

export async function patchResume(id: string, patch: Partial<Omit<ResumeRow, 'id' | 'createdAt'>>): Promise<ResumeRow | null> {
  const [row] = await db.update(resumes).set({ ...patch, updatedAt: new Date() }).where(eq(resumes.id, id)).returning();
  return row ?? null;
}

export function entriesOf<S extends ListSection>(row: ResumeRow, section: S): SectionEntry<S>[] {
  return [...(row[section] as SectionEntry<S>[])];
}

/** The redirect every editor write lands on. Form posts come back to the editor itself. */
export function editorPath(id: string, hash?: string): string {
  return `/resumes/${id}${hash ? `#${hash}` : ''}`;
}
