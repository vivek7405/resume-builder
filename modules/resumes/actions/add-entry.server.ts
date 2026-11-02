'use server';
import type { ActionResult } from '@webjsdev/server';
import { emptyEntry, isListSection } from '../types.ts';
import { targetFromForm } from '../utils/parse-section.ts';
import { editorPath, entriesOf, findResume, patchResume } from '../utils/store.server.ts';

/** Append an empty entry to a list section and return to it. */
export async function addEntry(formData: FormData): Promise<ActionResult<{ index: number }>> {
  const { resumeId, section } = targetFromForm(formData);
  if (!isListSection(section)) return { success: false, error: 'Unknown section.', status: 400 };
  const row = await findResume(resumeId);
  if (!row) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const entries = [...entriesOf(row, section), emptyEntry(section)];
  await patchResume(resumeId, { [section]: entries });
  const index = entries.length - 1;
  return { success: true, data: { index }, redirect: editorPath(resumeId, `${section}-${index}`) };
}
