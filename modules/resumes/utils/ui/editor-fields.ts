// Form field fragments for the editor. SSR-time html built on the kit's
// field helpers, so every control has a real label and error wiring.
import { html } from '@webjsdev/core';
import { fieldClass, fieldDescriptionClass, fieldErrorClass, fieldLabelClass } from '#components/ui/field.ts';
import { inputClass } from '#components/ui/input.ts';
import { textareaClass } from '#components/ui/textarea.ts';

export interface FieldOptions {
  id: string;
  name: string;
  label: string;
  value: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'month';
  placeholder?: string;
  hint?: string;
  error?: string;
  rows?: number;
  autocomplete?: string;
  disabled?: boolean;
  cls?: string;
}

function describedBy(o: FieldOptions) {
  const ids = [];
  if (o.hint) ids.push(`${o.id}-hint`);
  if (o.error) ids.push(`${o.id}-error`);
  return ids.length ? ids.join(' ') : null;
}

function notes(o: FieldOptions) {
  return html`
    ${o.hint ? html`<p id="${o.id}-hint" class=${fieldDescriptionClass()}>${o.hint}</p>` : ''}
    ${o.error ? html`<p id="${o.id}-error" class=${fieldErrorClass()} role="alert">${o.error}</p>` : ''}`;
}

export function textField(o: FieldOptions) {
  return html`
    <div class="${fieldClass()} ${o.cls ?? ''}" data-slot="field" data-orientation="vertical" data-invalid=${o.error ? 'true' : null}>
      <label for=${o.id} class=${fieldLabelClass()} data-slot="field-label">${o.label}</label>
      <input id=${o.id} name=${o.name} type=${o.type ?? 'text'} value=${o.value} placeholder=${o.placeholder ?? ''} class=${inputClass()}
        autocomplete=${o.autocomplete ?? null} ?disabled=${o.disabled ?? false} aria-invalid=${o.error ? 'true' : null} aria-describedby=${describedBy(o)}>
      ${notes(o)}
    </div>`;
}

export function textArea(o: FieldOptions) {
  return html`
    <div class="${fieldClass()} ${o.cls ?? ''}" data-slot="field" data-orientation="vertical" data-invalid=${o.error ? 'true' : null}>
      <label for=${o.id} class=${fieldLabelClass()} data-slot="field-label">${o.label}</label>
      <textarea id=${o.id} name=${o.name} rows=${String(o.rows ?? 4)} placeholder=${o.placeholder ?? ''} class=${textareaClass()}
        aria-invalid=${o.error ? 'true' : null} aria-describedby=${describedBy(o)}>${o.value}</textarea>
      ${notes(o)}
    </div>`;
}

export function hidden(name: string, value: string | number) {
  return html`<input type="hidden" name=${name} value=${String(value)}>`;
}
