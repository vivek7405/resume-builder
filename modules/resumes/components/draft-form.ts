import { WebComponent, prop, html, signal } from '@webjsdev/core';
import type { ActionResult } from '@webjsdev/server';
import { updateProfile } from '../actions/update-profile.server.ts';
import { updateSettings } from '../actions/update-settings.server.ts';
import { updateSkills } from '../actions/update-skills.server.ts';
import { saveEntry } from '../actions/save-entry.server.ts';
import { isListSection, type ListSection, type ResumeDocument } from '../types.ts';
import { entryFromForm, profileFromForm, settingsFromForm, skillsFromForm } from '../utils/parse-section.ts';
import { currentSection, patchDraft } from '../draft.ts';

type Status = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
type DraftSection = 'profile' | 'settings' | 'skills' | ListSection;

const AUTOSAVE_MS = 700;

/**
 * Wraps one editor form (slotted, so its markup stays free HTML). On input
 * it parses the form into the shared draft so the preview updates at once,
 * then autosaves through the section's action over RPC after a short pause.
 * A submit saves immediately. With JavaScript off the form posts as usual.
 */
export class DraftForm extends WebComponent({
  section: prop<DraftSection>(String),
  index: Number,
}) {
  private status = signal<Status>('idle');
  private message = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.index = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.timer) clearTimeout(this.timer);
  }

  private formOf(e: Event): HTMLFormElement | null {
    const el = e.target as Element | null;
    return el?.closest('form') ?? null;
  }

  /** Mirror the form into the draft. Pure parsing shared with the server. */
  private sync(form: HTMLFormElement) {
    const fd = new FormData(form);
    const patch: Partial<ResumeDocument> = {};
    if (this.section === 'profile') patch.profile = profileFromForm(fd);
    else if (this.section === 'skills') patch.skills = skillsFromForm(fd);
    else if (this.section === 'settings') {
      const s = settingsFromForm(fd);
      patch.template = s.template;
      patch.accent = s.accent;
    } else if (isListSection(this.section)) {
      const list = [...((currentSection(this.section) ?? []) as unknown[])];
      list[this.index] = entryFromForm(this.section, fd);
      (patch as Record<string, unknown>)[this.section] = list;
      const current = form.querySelector<HTMLInputElement>('input[name="current"]');
      const end = form.querySelector<HTMLInputElement>('input[name="end"]');
      if (current && end) end.disabled = current.checked;
    }
    patchDraft(patch);
  }

  private onInput = (e: Event) => {
    const form = this.formOf(e);
    if (!form) return;
    this.sync(form);
    this.status.set('dirty');
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.save(form), AUTOSAVE_MS);
  };

  private onSubmit = (e: Event) => {
    const form = this.formOf(e);
    if (!form) return;
    e.preventDefault();
    if (this.timer) clearTimeout(this.timer);
    this.sync(form);
    void this.save(form);
  };

  async save(form: HTMLFormElement) {
    this.status.set('saving');
    const fd = new FormData(form);
    try {
      const result = await this.dispatch(fd);
      if (result.success) {
        this.status.set('saved');
        this.message.set('');
      } else {
        this.status.set('error');
        this.message.set(Object.values(result.fieldErrors ?? {})[0] ?? result.error ?? 'Could not save.');
      }
    } catch {
      this.status.set('error');
      this.message.set('Could not reach the server. Your changes are still here.');
    }
  }

  private dispatch(fd: FormData): Promise<ActionResult<unknown>> {
    if (this.section === 'profile') return updateProfile(fd);
    if (this.section === 'settings') return updateSettings(fd);
    if (this.section === 'skills') return updateSkills(fd);
    return saveEntry(fd);
  }

  render() {
    const status = this.status.get();
    const text = status === 'saving' ? 'Saving…'
      : status === 'saved' ? 'Saved'
      : status === 'dirty' ? 'Unsaved changes'
      : status === 'error' ? this.message.get()
      : '';
    return html`
      <div @input=${this.onInput} @change=${this.onInput} @submit=${this.onSubmit}>
        <slot></slot>
        <p class="m-0 mt-2 min-h-5 text-right text-xs ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}" aria-live="polite" data-status=${status}>${text}</p>
      </div>
    `;
  }
}
DraftForm.register('draft-form');
