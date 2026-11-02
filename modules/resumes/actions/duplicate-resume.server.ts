'use server';
import type { ActionResult } from '@webjsdev/server';
import { db } from '#db/connection.server.ts';
import { resumes } from '#db/schema.server.ts';
import type { ResumeData } from '../types.ts';
import { editorPath, findResume } from '../utils/store.server.ts';

export async function duplicateResume(formData: FormData): Promise<ActionResult<ResumeData>> {
  const source = await findResume(String(formData.get('resumeId') ?? ''));
  if (!source) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = source;
  const [row] = await db.insert(resumes).values({ ...rest, title: `Copy of ${source.title}`.slice(0, 120) }).returning();
  return { success: true, data: row, redirect: editorPath(row.id) };
}
