'use server';
import type { ActionResult } from '@webjsdev/server';
import { isListSection } from '../types.ts';
import { targetFromForm } from '../utils/parse-section.ts';
import { editorPath, entriesOf, findResume, patchResume } from '../utils/store.server.ts';

/** Remove one entry of a list section by index. */
export async function removeEntry(formData: FormData): Promise<ActionResult<{ count: number }>> {
  const { resumeId, section, index } = targetFromForm(formData);
  if (!isListSection(section)) return { success: false, error: 'Unknown section.', status: 400 };
  const row = await findResume(resumeId);
  if (!row) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const entries = entriesOf(row, section).filter((_, i) => i !== index);
  await patchResume(resumeId, { [section]: entries });
  return { success: true, data: { count: entries.length }, redirect: editorPath(resumeId, section) };
}
