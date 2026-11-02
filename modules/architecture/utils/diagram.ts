/**
 * The drawing kit for /architecture and /architecture/internals.
 *
 * Hand-authored inline SVG, for three reasons: every stroke and fill is a
 * token, so one declaration reads in light and dark. A figure costs no request
 * and no script. And it is laid out by hand on an explicit grid, because an
 * auto-layout engine draws the graph it was given, not the mechanism a reader
 * needs to see.
 *
 * Two rules that are easy to break:
 *
 * - Marker ids are global to the page, so arrowDefs() renders ONCE per page.
 * - The figure shell scrolls sideways inside its own box. Below `minW` a wide
 *   drawing scrolls rather than shrinking into unreadable type, and the page
 *   body never scrolls sideways.
 *
 * The accent (primary) marks ONE thing per figure: the path it exists to show.
 */
import { html } from '@webjsdev/core';

const LABEL = 'font-mono text-[12px] fill-foreground';
const LABEL_SM = 'font-mono text-[10.5px] fill-foreground';
const LABEL_XS = 'font-mono text-[9.5px] fill-muted-foreground';

export type Tone = 'plain' | 'strong' | 'signal' | 'sunken';

const TONE_RECT: Record<Tone, string> = {
  plain: 'fill-card stroke-border',
  strong: 'fill-card stroke-border-strong',
  signal: 'fill-primary-tint stroke-primary',
  sunken: 'fill-muted stroke-border',
};

/** A labelled box, with up to two lines of detail under the label. */
export function box(o: { x: number; y: number; w: number; h: number; label: string; sub?: string; sub2?: string; tone?: Tone; small?: boolean }) {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const lines = o.sub2 ? 3 : o.sub ? 2 : 1;
  const top = cy - (lines - 1) * 7 + 4;
  return html`
    <g>
      <rect x=${o.x} y=${o.y} width=${o.w} height=${o.h} rx="6" class=${TONE_RECT[o.tone ?? 'plain']} stroke-width="1"></rect>
      <text x=${cx} y=${top} text-anchor="middle" class=${o.small ? LABEL_SM : LABEL}>${o.label}</text>
      ${o.sub ? html`<text x=${cx} y=${top + 14} text-anchor="middle" class=${LABEL_XS}>${o.sub}</text>` : ''}
      ${o.sub2 ? html`<text x=${cx} y=${top + 27} text-anchor="middle" class=${LABEL_XS}>${o.sub2}</text>` : ''}
    </g>
  `;
}

/** A region around several boxes, captioned at its top-left corner. */
export function frame(o: { x: number; y: number; w: number; h: number; label: string; tone?: Tone }) {
  return html`
    <g>
      <rect x=${o.x} y=${o.y} width=${o.w} height=${o.h} rx="8" class=${TONE_RECT[o.tone ?? 'sunken']} stroke-width="1"></rect>
      <text x=${o.x + 12} y=${o.y + 18} class=${LABEL_XS}>${o.label}</text>
    </g>
  `;
}

/** A box with a title and a few short lines under it, for a figure that lists what a place holds. */
export function card(o: { x: number; y: number; w: number; h: number; label: string; lines: string[]; tone?: Tone }) {
  return html`
    <g>
      <rect x=${o.x} y=${o.y} width=${o.w} height=${o.h} rx="6" class=${TONE_RECT[o.tone ?? 'plain']} stroke-width="1"></rect>
      <text x=${o.x + 12} y=${o.y + 22} class=${LABEL}>${o.label}</text>
      ${o.lines.map((t, i) => html`<text x=${o.x + 12} y=${o.y + 42 + i * 15} class=${LABEL_XS}>${t}</text>`)}
    </g>
  `;
}

/** The page's arrowheads, once per page. Sized to nothing rather than display:none, so the markers resolve. */
export function arrowDefs() {
  return html`
    <svg width="0" height="0" aria-hidden="true" focusable="false" class="absolute overflow-hidden">
      <defs>
        <marker id="ar-head" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 8 4 L 0 8 z" class="fill-muted-foreground"></path>
        </marker>
        <marker id="ar-head-signal" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 8 4 L 0 8 z" class="fill-primary"></path>
        </marker>
      </defs>
    </svg>
  `;
}

export type ArrowKind = 'solid' | 'dashed' | 'signal';

const ARROW_CLASS: Record<ArrowKind, string> = {
  solid: 'stroke-muted-foreground',
  dashed: 'stroke-muted-foreground [stroke-dasharray:4_4]',
  signal: 'stroke-primary',
};

/** A labelled arrow along a path. */
export function arrow(o: { d: string; label?: string; lx?: number; ly?: number; kind?: ArrowKind; anchor?: 'start' | 'middle' | 'end' }) {
  const kind = o.kind ?? 'solid';
  return html`
    <g>
      <path d=${o.d} fill="none" stroke-width=${kind === 'signal' ? '1.6' : '1.25'} class=${ARROW_CLASS[kind]} marker-end=${kind === 'signal' ? 'url(#ar-head-signal)' : 'url(#ar-head)'}></path>
      ${o.label ? html`<text x=${o.lx ?? 0} y=${o.ly ?? 0} text-anchor=${o.anchor ?? 'middle'} class=${LABEL_XS}>${o.label}</text>` : ''}
    </g>
  `;
}

/** Free-standing text, for a note not attached to a box. */
export function note(o: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return html`<text x=${o.x} y=${o.y} text-anchor=${o.anchor ?? 'start'} class=${LABEL_XS}>${o.text}</text>`;
}

/** A dashed vertical lifeline under a sequence-diagram header. */
export function lifeline(x: number, y1: number, y2: number) {
  return html`<path d="M ${x} ${y1} V ${y2}" fill="none" stroke-width="1" class="stroke-border-strong [stroke-dasharray:3_4]"></path>`;
}

/** The figure shell. `label` is the one claim the picture makes, and the caption when there is no longer one. */
export function figure(o: { label: string; caption?: unknown; viewBox: string; minW: string; body: unknown }) {
  return html`
    <figure class="m-0 min-w-0">
      <div class="overflow-x-auto rounded-xl border border-border bg-card px-4 py-5 md:px-6" tabindex="0" role="region" aria-label="Figure, scrolls sideways on a narrow screen">
        <svg role="img" aria-label=${o.label} viewBox=${o.viewBox} class="h-auto w-full ${o.minW}" xmlns="http://www.w3.org/2000/svg">
          ${o.body}
        </svg>
      </div>
      <figcaption class="mt-3 max-w-[74ch] text-sm leading-relaxed text-muted-foreground">${o.caption ?? o.label}</figcaption>
    </figure>
  `;
}
