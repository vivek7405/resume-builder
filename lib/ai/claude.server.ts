// Server-only Claude client for the sample generator. Never imported by a
// page or a component: the action in modules/resumes/actions reaches it.
//
// Credentials resolve the way the SDK documents: ANTHROPIC_API_KEY, then
// ANTHROPIC_AUTH_TOKEN (a Claude subscription bearer token goes here), then
// an `ant auth login` profile. Set FOLIO_AI=off to force the built-in sample.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { ResumeDocument } from '#modules/resumes/types.ts';

export const CLAUDE_MODEL = 'claude-opus-5-5';

export function hasClaudeCredentials(): boolean {
  if (process.env.FOLIO_AI === 'off') return false;
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const month = z.string().describe("A month as 'YYYY-MM', or an empty string");

const GeneratedResume = z.object({
  profile: z.object({
    fullName: z.string(),
    headline: z.string().describe('The job title in four words or fewer'),
    email: z.string(),
    phone: z.string(),
    location: z.string().describe('City and country'),
    website: z.string().describe('A personal site domain without a scheme, or empty'),
    summary: z.string().describe('Two or three sentences, first person implied, concrete and specific'),
  }),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    location: z.string(),
    start: month,
    end: month,
    current: z.boolean(),
    highlights: z.string().describe('Two to four achievement lines separated by newlines, each with a number or a concrete outcome'),
  })).describe('Two or three roles, most recent first'),
  education: z.array(z.object({
    school: z.string(),
    degree: z.string(),
    field: z.string(),
    start: month,
    end: month,
    notes: z.string(),
  })).describe('One or two entries'),
  projects: z.array(z.object({
    name: z.string(),
    link: z.string().describe('A domain or repo path without a scheme, or empty'),
    description: z.string().describe('One sentence'),
  })).describe('One or two side projects'),
  skills: z.array(z.string()).describe('Six to ten short skills'),
});

export type GeneratedResume = z.infer<typeof GeneratedResume>;

const SYSTEM = `You write complete, realistic, entirely fictional resumes used to showcase a resume builder.
Invent a plausible person for the brief: a name that fits the location, a believable career arc with real-sounding (but not real) companies, specific achievements with numbers, and dates that line up.
Months are 'YYYY-MM'. Highlights are separated by newlines and never start with a bullet character. Keep everything concise enough to fit a single A4 page.
Never use the name of a real person, and never claim employment at a company that actually exists.`;

/** Ask Claude for one resume document matching the brief. Throws on any API failure. */
export async function generateResumeDocument(brief: string): Promise<Omit<ResumeDocument, 'template' | 'accent'>> {
  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const prompt = brief.trim()
    ? `Write a resume for this brief: ${brief.trim()}`
    : 'Write a resume for a mid-career professional in a field of your choosing. Vary the field, the country and the industry.';
  const response = await client.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: zodOutputFormat(GeneratedResume) },
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude declined the request.');
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Claude returned no parseable resume.');
  return parsed;
}
