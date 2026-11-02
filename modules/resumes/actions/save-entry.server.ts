'use server';
import type { ActionResult } from '@webjsdev/server';
import { isListSection } from '../types.ts';
import { entryFromForm, targetFromForm } from '../utils/parse-section.ts';
import { entriesOf, findResume, patchResume } from '../utils/store.server.ts';

/** Replace one entry of a list section (experience, education, projects) by index. */
export async function saveEntry(formData: FormData): Promise<ActionResult<{ updatedAt: Date }>> {
  const { resumeId, section, index } = targetFromForm(formData);
  if (!isListSection(section)) return { success: false, error: 'Unknown section.', status: 400 };
  const row = await findResume(resumeId);
  if (!row) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const entries = entriesOf(row, section);
  if (index >= entries.length) return { success: false, error: 'That entry no longer exists.', status: 404 };
  entries[index] = entryFromForm(section, formData);
  const updated = await patchResume(resumeId, { [section]: entries });
  return { success: true, data: { updatedAt: updated?.updatedAt ?? new Date() } };
}
