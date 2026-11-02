'use server';
import type { ActionResult } from '@webjsdev/server';
import { skillsFromForm } from '../utils/parse-section.ts';
import { findResume, patchResume } from '../utils/store.server.ts';

/** Replace the skills list from the comma or newline separated text. */
export async function updateSkills(formData: FormData): Promise<ActionResult<{ updatedAt: Date }>> {
  const id = String(formData.get('resumeId') ?? '');
  if (!(await findResume(id))) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const row = await patchResume(id, { skills: skillsFromForm(formData) });
  return { success: true, data: { updatedAt: row?.updatedAt ?? new Date() } };
}
