'use server';
import { hasClaudeCredentials } from '#lib/ai/claude.server.ts';

export const method = 'GET';

/** Whether "Generate a sample" will ask Claude or use the built-in sample. */
export async function aiEnabled(): Promise<boolean> {
  return hasClaudeCredentials();
}
