'use server';
import type { ActionResult } from '@webjsdev/server';
import { db } from '#db/connection.server.ts';
import { resumes } from '#db/schema.server.ts';
import { generateResumeDocument, hasClaudeCredentials } from '#lib/ai/claude.server.ts';
import { ACCENTS, isTemplateId, type ResumeData, type TemplateId } from '../types.ts';
import { sampleFor } from '../utils/sample-data.ts';
import { editorPath } from '../utils/store.server.ts';

/**
 * Create a complete sample resume so anyone can judge the output in one
 * click. With a Claude credential the content is generated for the brief;
 * without one, or when the API fails, a built-in sample is used instead and
 * the editor says so (?sample=builtin). Never blocks on a missing key.
 */
export async function generateSample(formData: FormData): Promise<ActionResult<ResumeData>> {
  const brief = String(formData.get('brief') ?? '').trim().slice(0, 300);
  const templateRaw = String(formData.get('template') ?? '');
  const template: TemplateId = isTemplateId(templateRaw) ? templateRaw : 'classic';
  const accent = ACCENTS[Math.floor(Math.random() * ACCENTS.length)].hex;

  if (hasClaudeCredentials()) {
    try {
      const generated = await generateResumeDocument(brief);
      const title = brief ? `Sample: ${brief}`.slice(0, 120) : `Sample: ${generated.profile.headline}`.slice(0, 120);
      const [row] = await db.insert(resumes).values({ title, template, accent, ...generated }).returning();
      return { success: true, data: row, redirect: `${editorPath(row.id)}?sample=ai` };
    } catch (error) {
      console.error('[folio] sample generation failed, using the built-in sample:', error instanceof Error ? error.message : error);
    }
  }

  const sample = sampleFor(template);
  const [row] = await db.insert(resumes).values({ title: `Sample: ${sample.document.profile.headline}`, ...sample.document, template, accent }).returning();
  return { success: true, data: row, redirect: `${editorPath(row.id)}?sample=builtin` };
}
