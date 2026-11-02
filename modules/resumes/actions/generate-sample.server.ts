'use server';
import type { ActionResult } from '@webjsdev/server';
import { db } from '#db/connection.server.ts';
import { resumes } from '#db/schema.server.ts';
import { ACCENTS, isTemplateId, type ResumeData, type TemplateId } from '../types.ts';
import { randomSample } from '../utils/sample-data.ts';
import { editorPath } from '../utils/store.server.ts';

/**
 * Create a complete sample resume so anyone can judge the output in one
 * click: one of the built-in fictional resumes, in the requested template
 * (or its own) with a random accent, then open it in the editor.
 */
export async function generateSample(formData: FormData): Promise<ActionResult<ResumeData>> {
  const templateRaw = String(formData.get('template') ?? '');
  const sample = randomSample();
  const template: TemplateId = isTemplateId(templateRaw) ? templateRaw : sample.doc.template;
  const accent = ACCENTS[Math.floor(Math.random() * ACCENTS.length)].hex;
  const [row] = await db
    .insert(resumes)
    .values({ title: `Sample: ${sample.doc.profile.headline}`, ...sample.doc, template, accent })
    .returning();
  return { success: true, data: row, redirect: `${editorPath(row.id)}?sample=1` };
}
