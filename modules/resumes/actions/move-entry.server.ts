'use server';
import type { ActionResult } from '@webjsdev/server';
import { isListSection } from '../types.ts';
import { targetFromForm } from '../utils/parse-section.ts';
import { editorPath, entriesOf, findResume, patchResume } from '../utils/store.server.ts';

/** Swap an entry with its neighbour. `direction` is 'up' or 'down'. */
export async function moveEntry(formData: FormData): Promise<ActionResult<{ index: number }>> {
  const { resumeId, section, index } = targetFromForm(formData);
  const direction = String(formData.get('direction') ?? '') === 'up' ? -1 : 1;
  if (!isListSection(section)) return { success: false, error: 'Unknown section.', status: 400 };
  const row = await findResume(resumeId);
  if (!row) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const entries = entriesOf(row, section);
  const target = index + direction;
  if (index >= entries.length || target < 0 || target >= entries.length) {
    return { success: true, data: { index }, redirect: editorPath(resumeId, `${section}-${index}`) };
  }
  [entries[index], entries[target]] = [entries[target], entries[index]];
  await patchResume(resumeId, { [section]: entries });
  return { success: true, data: { index: target }, redirect: editorPath(resumeId, `${section}-${target}`) };
}
