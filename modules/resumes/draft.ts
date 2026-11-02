// The editor's shared draft: what the forms hold right now, before and
// between saves. The preview island merges it over the saved document, so
// every keystroke shows up on the sheet. Module scope on purpose (two
// components with no ancestor relationship share a module signal); only
// browser code ever writes it.
import { signal } from '@webjsdev/core';
import type { ResumeDocument } from './types.ts';

export const draft = signal<Partial<ResumeDocument>>({});

/** The saved document the draft is layered over, published by the preview once it connects. */
export const baseDocument = signal<ResumeDocument | null>(null);

export function patchDraft(patch: Partial<ResumeDocument>) {
  draft.set({ ...draft.get(), ...patch });
}

export function resetDraft() {
  draft.set({});
  baseDocument.set(null);
}

/** The current value of one section: the draft's if typed, else the saved one. */
export function currentSection<K extends keyof ResumeDocument>(key: K): ResumeDocument[K] | undefined {
  const d = draft.get();
  if (key in d) return d[key] as ResumeDocument[K];
  return baseDocument.get()?.[key];
}
