'use server';
import { db } from '#db/connection.server.ts';
import type { ResumeData } from '../types.ts';

export const method = 'GET';

export type ResumeSort = 'updated' | 'title';

/** Every resume, filtered by a free-text query over the title and the name, newest edit first. */
export async function listResumes(input: { q?: string; sort?: ResumeSort } = {}): Promise<ResumeData[]> {
  const q = (input.q ?? '').trim().toLowerCase();
  const sort: ResumeSort = input.sort === 'title' ? 'title' : 'updated';
  const rows = await db.query.resumes.findMany({
    orderBy: sort === 'title' ? { title: 'asc' } : { updatedAt: 'desc' },
  });
  if (!q) return rows;
  return rows.filter((r) => r.title.toLowerCase().includes(q) || r.profile.fullName.toLowerCase().includes(q) || r.profile.headline.toLowerCase().includes(q));
}
