'use server';
import type { ActionResult } from '@webjsdev/server';
import { settingsFromForm } from '../utils/parse-section.ts';
import { findResume, patchResume } from '../utils/store.server.ts';

/** Replace the name, template and accent. */
export async function updateSettings(formData: FormData): Promise<ActionResult<{ updatedAt: Date }>> {
  const id = String(formData.get('resumeId') ?? '');
  if (!(await findResume(id))) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const settings = settingsFromForm(formData);
  if (!settings.title) return { success: false, fieldErrors: { title: 'The resume needs a name.' }, status: 422 };
  const row = await patchResume(id, settings);
  return { success: true, data: { updatedAt: row?.updatedAt ?? new Date() } };
}
