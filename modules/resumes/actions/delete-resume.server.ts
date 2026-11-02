'use server';
import { eq } from 'drizzle-orm';
import type { ActionResult } from '@webjsdev/server';
import { db } from '#db/connection.server.ts';
import { resumes } from '#db/schema.server.ts';

export async function deleteResume(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const id = String(formData.get('resumeId') ?? '');
  if (!id) return { success: false, error: 'Missing resume.', status: 400 };
  await db.delete(resumes).where(eq(resumes.id, id));
  return { success: true, data: { id }, redirect: '/resumes' };
}
