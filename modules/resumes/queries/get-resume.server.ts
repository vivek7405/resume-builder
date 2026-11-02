'use server';
import { findResume } from '../utils/store.server.ts';
import type { ResumeData } from '../types.ts';

export const method = 'GET';

export async function getResume(id: string): Promise<ResumeData | null> {
  return findResume(id);
}
