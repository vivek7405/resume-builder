'use server';
import type { ActionResult } from '@webjsdev/server';
import { db } from '#db/connection.server.ts';
import { resumes } from '#db/schema.server.ts';
import { emptyDocument, isTemplateId, type ResumeData } from '../types.ts';
import { editorPath } from '../utils/store.server.ts';

/** Create an empty resume from a name and a template, then open the editor. */
export async function createResume(formData: FormData): Promise<ActionResult<ResumeData>> {
  const title = String(formData.get('title') ?? '').trim().slice(0, 120);
  const templateRaw = String(formData.get('template') ?? 'classic');
  const template = isTemplateId(templateRaw) ? templateRaw : 'classic';
  if (!title) return { success: false, fieldErrors: { title: 'Give the resume a name, like "Backend roles 2026".' }, status: 422 };
  const [row] = await db.insert(resumes).values({ title, ...emptyDocument(template) }).returning();
  return { success: true, data: row, redirect: editorPath(row.id) };
}
