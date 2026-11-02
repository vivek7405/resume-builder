/**
 * The figures on /architecture. Each states ONE claim (its label), is laid out
 * by hand on the grid in its viewBox, and draws only what the code does. The
 * accent marks the path the figure exists to show. internals-figures.ts holds
 * the ones for /architecture/internals.
 */
import { arrow, box, card, figure, frame, note } from './diagram.ts';
import { html } from '@webjsdev/core';

/** The whole system: one process, one file, and five small scripts. */
export function systemFigure() {
  return figure({
    label: 'Folio is one WebJs process on Bun and one SQLite file. The browser receives HTML that works on its own, and five islands are the only JavaScript the app itself ships.',
    viewBox: '0 0 1000 370',
    minW: 'min-w-[820px]',
    body: html`
      ${frame({ x: 20, y: 20, w: 280, h: 330, label: 'browser' })}
      ${box({ x: 40, y: 48, w: 240, h: 56, label: 'server-rendered HTML', sub: 'forms work with no script' })}
      ${card({ x: 40, y: 122, w: 240, h: 124, label: 'islands', tone: 'signal', lines: ['draft-form', 'resume-preview', 'fit-sheet', 'print-button', 'theme-toggle'] })}
      ${box({ x: 40, y: 270, w: 240, h: 60, label: 'print dialog', sub: 'the browser makes the PDF' })}

      ${frame({ x: 400, y: 20, w: 300, h: 330, label: 'WebJs on Bun, one process' })}
      ${box({ x: 420, y: 48, w: 260, h: 56, label: 'pages', sub: 'app/(app) and app/(print), render only' })}
      ${box({ x: 420, y: 122, w: 260, h: 56, label: 'queries', sub: 'listResumes, getResume' })}
      ${box({ x: 420, y: 196, w: 260, h: 56, label: 'actions', sub: 'FormData in, one section replaced' })}
      ${box({ x: 420, y: 270, w: 260, h: 60, label: 'export route', sub: '/resumes/[id]/export, JSON' })}

      ${box({ x: 790, y: 150, w: 190, h: 76, label: 'SQLite', sub: 'db/dev.db', sub2: 'one resumes table', tone: 'strong' })}

      ${arrow({ d: 'M 416 66 H 284', label: 'HTML', lx: 350, ly: 60 })}
      ${arrow({ d: 'M 284 90 H 370 V 212 H 416', label: 'form POST', lx: 327, ly: 84 })}
      ${arrow({ d: 'M 284 184 H 340 V 236 H 416', label: 'RPC', lx: 312, ly: 178, kind: 'signal' })}
      ${arrow({ d: 'M 684 150 H 740 V 176 H 786', label: 'Drizzle', lx: 742, ly: 144 })}
      ${arrow({ d: 'M 684 224 H 740 V 200 H 786' })}
      ${arrow({ d: 'M 684 300 H 885 V 230' })}
      ${arrow({ d: 'M 30 76 V 300 H 36', kind: 'dashed' })}
    `,
    caption: html`The accent is the only path that needs JavaScript: an island calling an action over RPC. Take
      it away and the same action still runs from a form post.`,
  });
}

/** One row, and how a write touches it. */
export function dataFigure() {
  return figure({
    label: 'A resume is one row whose sections are JSON columns. Every write reads the row, changes one section and writes that whole section back.',
    viewBox: '0 0 1000 300',
    minW: 'min-w-[820px]',
    body: html`
      ${frame({ x: 20, y: 20, w: 620, h: 260, label: 'the resumes table, one row per resume' })}
      ${card({ x: 40, y: 48, w: 180, h: 212, label: 'plain columns', lines: ['id', 'title', 'template', 'accent', 'createdAt', 'updatedAt'] })}
      ${box({ x: 240, y: 48, w: 180, h: 60, label: 'profile', sub: 'one object' })}
      ${box({ x: 440, y: 48, w: 180, h: 60, label: 'experience', sub: 'array of entries', tone: 'signal' })}
      ${box({ x: 240, y: 124, w: 180, h: 60, label: 'education', sub: 'array of entries' })}
      ${box({ x: 440, y: 124, w: 180, h: 60, label: 'projects', sub: 'array of entries' })}
      ${box({ x: 240, y: 200, w: 380, h: 60, label: 'skills', sub: 'array of strings' })}

      ${card({ x: 720, y: 48, w: 260, h: 150, label: 'saveEntry', tone: 'strong', lines: ['1. findResume(id)', '2. copy the entries array', '3. replace entries[index]', '4. patchResume(id, { [section] })', '   updatedAt moves with it'] })}
      ${arrow({ d: 'M 716 90 H 624', label: 'whole array', lx: 670, ly: 84, kind: 'signal' })}
      ${note({ x: 720, y: 224, text: 'An entry is addressed by its index.' })}
      ${note({ x: 720, y: 240, text: 'There are no child tables and no joins.' })}
    `,
  });
}

/** One sheet function, three callers. */
export function sheetFigure() {
  return figure({
    label: 'One function renders every resume in the app, so what the editor previews is what the print page prints.',
    viewBox: '0 0 1000 280',
    minW: 'min-w-[820px]',
    body: html`
      ${box({ x: 20, y: 24, w: 240, h: 62, label: 'print page', sub: 'on the server, as free HTML' })}
      ${box({ x: 20, y: 108, w: 240, h: 62, label: 'resume-preview', sub: 'in the browser, on every keystroke' })}
      ${box({ x: 20, y: 192, w: 240, h: 62, label: 'sheetThumb', sub: 'home, list, new, templates' })}

      ${box({ x: 390, y: 98, w: 220, h: 82, label: 'resumeSheet(doc)', sub: 'A4 article, 210mm wide', sub2: '--accent from the row', tone: 'signal' })}

      ${box({ x: 740, y: 24, w: 240, h: 62, label: 'classicTemplate', sub: 'serif, centred, hairlines', small: true })}
      ${box({ x: 740, y: 108, w: 240, h: 62, label: 'modernTemplate', sub: 'two columns, tinted sidebar', small: true })}
      ${box({ x: 740, y: 192, w: 240, h: 62, label: 'minimalTemplate', sub: 'sans, whitespace, one accent line', small: true })}

      ${arrow({ d: 'M 264 55 H 325 V 122 H 386' })}
      ${arrow({ d: 'M 264 139 H 386' })}
      ${arrow({ d: 'M 264 223 H 325 V 156 H 386' })}
      ${arrow({ d: 'M 614 122 H 675 V 55 H 736' })}
      ${arrow({ d: 'M 614 139 H 736', label: 'doc.template', lx: 675, ly: 133 })}
      ${arrow({ d: 'M 614 156 H 675 V 223 H 736' })}
    `,
  });
}
