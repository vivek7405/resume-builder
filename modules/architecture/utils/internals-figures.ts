/**
 * The figures on /architecture/internals. Same rules as figures.ts: one claim
 * each, laid out by hand, and nothing the code does not do.
 */
import { arrow, box, card, figure, frame, lifeline, note } from './diagram.ts';
import { html } from '@webjsdev/core';
import { C } from './page.ts';

/** One keystroke, from the field to the sheet and to the disk. */
export function keystrokeFigure() {
  const L = { f: 80, d: 270, s: 460, p: 650, a: 810, db: 930 };
  const y = (i: number) => 104 + i * 38;
  const msg = (i: number, from: number, to: number, label: string, kind: 'solid' | 'signal' = 'solid') => {
    const dir = to > from ? 1 : -1;
    return arrow({ d: `M ${from + dir * 2} ${y(i)} H ${to - dir * 3}`, label, lx: (from + to) / 2, ly: y(i) - 6, kind });
  };
  return figure({
    label: 'A keystroke takes two paths. The sheet updates at once through a signal in the browser, and 700 milliseconds after the last input the form saves through its action.',
    viewBox: '0 0 1000 400',
    minW: 'min-w-[860px]',
    body: html`
      ${box({ x: L.f - 60, y: 16, w: 120, h: 44, label: 'form field', small: true })}
      ${box({ x: L.d - 70, y: 16, w: 140, h: 44, label: 'draft-form', small: true, tone: 'strong' })}
      ${box({ x: L.s - 70, y: 16, w: 140, h: 44, label: 'draft signal', small: true })}
      ${box({ x: L.p - 70, y: 16, w: 140, h: 44, label: 'resume-preview', small: true })}
      ${box({ x: L.a - 55, y: 16, w: 110, h: 44, label: 'action', small: true })}
      ${box({ x: L.db - 55, y: 16, w: 110, h: 44, label: 'SQLite', small: true })}
      ${[L.f, L.d, L.s, L.p, L.a, L.db].map((x) => lifeline(x, 60, 384))}

      ${msg(0, L.f, L.d, 'input event')}
      ${msg(1, L.d, L.s, 'patchDraft(parsed)', 'signal')}
      ${msg(2, L.s, L.p, 're-render: saved + draft', 'signal')}
      ${note({ x: L.d + 8, y: y(3) + 4, text: 'a timer waits AUTOSAVE_MS (700), and each new input restarts it' })}
      ${msg(4, L.d, L.a, 'updateProfile(FormData) over RPC')}
      ${msg(5, L.a, L.db, 'patchResume')}
      ${msg(6, L.a, L.d, '{ success: true }')}
      ${note({ x: L.d + 8, y: y(7) - 2, text: 'status: Unsaved changes, Saving…, Saved, or the error' })}
    `,
    caption: html`Both sides parse with the same pure functions, in ${C('parse-section.ts')}, so what the sheet
      shows while typing is what the action stores. The other sections call ${C('updateSettings')},
      ${C('updateSkills')} or ${C('saveEntry')} at the same step.`,
  });
}

/** The same write with no script at all. */
export function formFigure() {
  return figure({
    label: 'With JavaScript off, a form posts to the page. Success answers 303 and the browser reloads the editor. Failure answers 422 with the page rendered again, the typed values kept.',
    viewBox: '0 0 1000 290',
    minW: 'min-w-[820px]',
    body: html`
      ${box({ x: 20, y: 110, w: 170, h: 70, label: 'browser', sub: 'a bound form' })}
      ${box({ x: 270, y: 110, w: 190, h: 70, label: 'WebJs', sub: 'finds the bound action' })}
      ${box({ x: 540, y: 110, w: 170, h: 70, label: 'action', sub: 'checks, then writes', tone: 'strong' })}
      ${box({ x: 790, y: 40, w: 190, h: 70, label: '303 See Other', sub: 'Location: the editor', tone: 'signal' })}
      ${box({ x: 790, y: 180, w: 190, h: 70, label: '422', sub: 'the page, with actionData' })}

      ${arrow({ d: 'M 194 145 H 266', label: 'POST', lx: 230, ly: 139 })}
      ${arrow({ d: 'M 464 145 H 536', label: 'FormData', lx: 500, ly: 139 })}
      ${arrow({ d: 'M 714 130 H 750 V 75 H 786', label: 'success', lx: 748, ly: 69, anchor: 'end' })}
      ${arrow({ d: 'M 714 160 H 750 V 215 H 786', label: 'fieldErrors', lx: 748, ly: 233, anchor: 'end' })}
      ${arrow({ d: 'M 885 36 V 16 H 105 V 106', label: 'GET the editor, so a refresh never posts twice', lx: 495, ly: 10, kind: 'signal' })}
      ${arrow({ d: 'M 885 254 V 274 H 105 V 184', label: 'errors shown, what was typed still in the fields', lx: 495, ly: 268 })}
    `,
    caption: html`A bound form works the same way with JavaScript on, except that the client router applies the
      303 without a full page load. Add, move and remove are small forms of their own, one per button, so
      reordering a resume needs no script either.`,
  });
}

/** How an A4 sheet fits a column. */
export function scaleFigure() {
  return figure({
    label: 'The sheet is always 210mm wide and is scaled down to its column. CSS sets the scale before the first paint, and the island only refines it afterwards.',
    viewBox: '0 0 1000 340',
    minW: 'min-w-[820px]',
    body: html`
      ${frame({ x: 20, y: 20, w: 400, h: 300, label: 'fit-sheet, a size container' })}
      ${frame({ x: 40, y: 48, w: 360, h: 252, label: 'data-frame: --s, overflow hidden', tone: 'plain' })}
      ${frame({ x: 60, y: 76, w: 320, h: 204, label: 'div, 210mm wide: transform scale(var(--s))', tone: 'sunken' })}
      ${box({ x: 80, y: 104, w: 280, h: 156, label: 'article.resume-sheet', sub: 'always laid out at 210mm', sub2: 'so the line breaks never change', tone: 'plain' })}

      ${box({ x: 560, y: 24, w: 420, h: 84, label: '1. first paint, CSS only', sub: '--s: calc(100cqw / 210mm)', sub2: 'exact, so the sheet does not jump', tone: 'signal' })}
      ${box({ x: 560, y: 128, w: 420, h: 84, label: 'or, with no typed arithmetic', sub: '--s: var(--s-guess, 0.4)', sub2: 'the page passes a guess, which can adjust once' })}
      ${box({ x: 560, y: 232, w: 420, h: 84, label: '2. after hydration, ResizeObserver', sub: 'writes the same --s', sub2: 'and sets the frame height to the scaled sheet' })}

      ${arrow({ d: 'M 556 66 H 490 V 120 H 404', kind: 'signal' })}
      ${arrow({ d: 'M 556 170 H 404' })}
      ${arrow({ d: 'M 556 274 H 490 V 220 H 404' })}
    `,
  });
}

/** What the print stylesheet does to a long resume. */
export function printFigure() {
  const line = (x: number, y: number, w: number) => html`<rect x=${x} y=${y} width=${w} height="4" rx="2" class="fill-border-strong"></rect>`;
  const entry = (x: number, y: number, tone: 'plain' | 'signal' = 'plain') => html`
    ${box({ x, y, w: 170, h: 62, label: '', tone })}
    ${line(x + 12, y + 14, 110)}${line(x + 12, y + 28, 146)}${line(x + 12, y + 42, 128)}`;
  return figure({
    label: 'On paper the toolbar and backdrop go away, and a long resume breaks between entries, never inside one, with the padding repeated on each page.',
    viewBox: '0 0 1000 340',
    minW: 'min-w-[820px]',
    body: html`
      ${frame({ x: 20, y: 20, w: 270, h: 300, label: 'on screen' })}
      ${box({ x: 36, y: 44, w: 238, h: 34, label: 'toolbar, .no-print', small: true })}
      ${box({ x: 62, y: 92, w: 186, h: 212, label: 'the sheet', sub: 'on a muted backdrop', small: true })}

      ${arrow({ d: 'M 294 170 H 376', label: '@media print', lx: 335, ly: 164 })}

      ${frame({ x: 390, y: 20, w: 210, h: 300, label: 'page 1, A4, margin 0', tone: 'plain' })}
      ${entry(410, 48)}${entry(410, 122)}
      ${note({ x: 495, y: 225, text: 'not enough room left', anchor: 'middle' })}
      ${note({ x: 495, y: 240, text: 'for the next entry', anchor: 'middle' })}

      ${frame({ x: 620, y: 20, w: 210, h: 300, label: 'page 2', tone: 'plain' })}
      ${entry(640, 48, 'signal')}${entry(640, 122)}

      ${arrow({ d: 'M 580 262 H 605 V 79 H 636', label: 'whole', lx: 600, ly: 258, anchor: 'end', kind: 'signal' })}

      ${card({ x: 850, y: 48, w: 130, h: 158, label: 'rules', lines: ['break-inside:', '  avoid', 'box-decoration-', '  break: clone', 'print-color-', '  adjust: exact'] })}
    `,
  });
}
