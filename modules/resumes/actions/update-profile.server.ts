'use server';
import type { ActionResult } from '@webjsdev/server';
import { profileFromForm } from '../utils/parse-section.ts';
import { findResume, patchResume } from '../utils/store.server.ts';

/** Replace the profile section. Bound to the profile form and called over RPC by the autosave island. */
export async function updateProfile(formData: FormData): Promise<ActionResult<{ updatedAt: Date }>> {
  const id = String(formData.get('resumeId') ?? '');
  if (!(await findResume(id))) return { success: false, error: 'That resume no longer exists.', status: 404 };
  const profile = profileFromForm(formData);
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    return { success: false, fieldErrors: { email: 'That does not look like an email address.' }, status: 422 };
  }
  const row = await patchResume(id, { profile });
  return { success: true, data: { updatedAt: row?.updatedAt ?? new Date() } };
}
