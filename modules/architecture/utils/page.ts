/**
 * The page parts /architecture and /architecture/internals share: the hero, a
 * section, the contents strip, the plain-terms aside, a numbered list, a card
 * grid, a table, a protocol panel and the "in the code" line. Drawn in the
 * app's tokens only. The paper tokens are the resume sheet, white in both
 * themes, so nothing here uses them.
 */
import { html } from '@webjsdev/core';

export const PROSE = 'm-0 max-w-[68ch] text-[15.5px] leading-[1.75] text-muted-foreground';
export const LINK = 'font-medium text-foreground underline decoration-border-strong decoration-2 underline-offset-[3px] hover:decoration-foreground';
export const CODE = 'rounded bg-muted px-1 py-px font-mono text-[0.86em] text-foreground';
const LABEL = 'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

export const C = (s: string) => html`<code class=${CODE}>${s}</code>`;

export function hero(o: { kicker: string; heading: string; lede: unknown; actions?: unknown }) {
  return html`
    <section class="border-b border-border pb-12 pt-6 md:pb-16 md:pt-12">
      <p class="m-0 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">${o.kicker}</p>
      <h1 class="m-0 max-w-[18ch] font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl">${o.heading}</h1>
      <p class="m-0 mt-6 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">${o.lede}</p>
      ${o.actions ? html`<div class="mt-8 flex flex-wrap gap-3">${o.actions}</div>` : ''}
    </section>
  `;
}

export function section(o: { id: string; heading: string; lede?: unknown; body: unknown }) {
  return html`
    <section id=${o.id} class="scroll-mt-20 border-b border-border py-14 last:border-b-0 md:py-20">
      <h2 class="m-0 max-w-[26ch] font-display text-4xl leading-[1.08] tracking-tight">${o.heading}</h2>
      ${o.lede ? html`<p class="m-0 mt-4 max-w-[62ch] text-base leading-relaxed text-muted-foreground">${o.lede}</p>` : ''}
      <div class="mt-9 min-w-0 md:mt-11">${o.body}</div>
    </section>
  `;
}

/** A wrapped row of anchors. No script and no sticky sidebar, so it never collapses on a phone. */
export function contents(items: [id: string, label: string][]) {
  return html`
    <nav aria-label="On this page" class="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border py-4">
      <span class=${LABEL}>On this page</span>
      ${items.map(([id, label]) => html`<a class="text-sm text-muted-foreground no-underline hover:text-foreground" href="#${id}">${label}</a>`)}
    </nav>
  `;
}

/** The plain-language aside under a dense section. The paragraph above stays the authority. */
export function plainly(body: unknown) {
  return html`
    <aside class="mt-8 max-w-[72ch] border-l-2 border-border-strong pl-5">
      <p class="m-0 text-sm leading-[1.75] text-muted-foreground"><span class="mr-2 ${LABEL}">In plain terms</span>${body}</p>
    </aside>
  `;
}

/** The files a reader opens to check a section. The test asserts each path exists. */
export function sources(paths: string[]) {
  return html`
    <p data-sources class="m-0 mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
      <span class=${LABEL}>In the code</span>
      ${paths.map((p) => html`<code class=${CODE}>${p}</code>`)}
    </p>
  `;
}

/** A numbered list of titled paragraphs, divided by hairlines. */
export function steps(items: [title: string, body: unknown][]) {
  return html`
    <ol class="m-0 flex list-none flex-col p-0">
      ${items.map(([title, body], i) => html`
        <li class="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-5 md:gap-4 ${i > 0 ? 'border-t border-border' : ''}">
          <span class="pt-0.5 font-mono text-sm text-muted-foreground">${String(i + 1).padStart(2, '0')}</span>
          <div class="min-w-0">
            <h3 class="m-0 text-base font-semibold tracking-tight">${title}</h3>
            <p class="m-0 mt-1.5 max-w-[72ch] text-[15px] leading-[1.7] text-muted-foreground">${body}</p>
          </div>
        </li>
      `)}
    </ol>
  `;
}

/** Titled cells in a hairline grid. `cols` is the class for wider screens. */
export function cells(items: [title: unknown, body: unknown][], cols = 'md:grid-cols-2') {
  return html`
    <div class="grid gap-px overflow-hidden rounded-xl border border-border bg-border ${cols}">
      ${items.map(([title, body]) => html`
        <div class="min-w-0 bg-card p-5 md:p-6">
          <p class="m-0 font-semibold">${title}</p>
          <p class="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">${body}</p>
        </div>
      `)}
    </div>
  `;
}

/** A plain table that scrolls inside its own box when the screen is narrow. */
export function table(o: { caption: string; head: string[]; rows: unknown[][]; minW?: string }) {
  return html`
    <div class="overflow-x-auto rounded-xl border border-border bg-card" tabindex="0" role="region" aria-label=${o.caption}>
      <table class="w-full border-collapse text-sm ${o.minW ?? 'min-w-[620px]'}">
        <caption class="sr-only">${o.caption}</caption>
        <thead>
          <tr class="border-b border-border-strong text-left">
            ${o.head.map((h) => html`<th scope="col" class="px-4 py-3 ${LABEL}">${h}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${o.rows.map((r) => html`
            <tr class="border-b border-border align-top last:border-b-0">
              ${r.map((c, i) => html`<td class="px-4 py-3.5 ${i === 0 ? 'whitespace-nowrap font-mono text-[13px] text-foreground' : 'text-muted-foreground'}">${c}</td>`)}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
}

/** Protocol or tool output, drawn like a terminal: a monospace panel with a title. */
export function wire(title: string, lines: [text: string, note?: string][]) {
  return html`
    <div class="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/50">
      <p class="m-0 border-b border-border px-4 py-2.5 ${LABEL}">${title}</p>
      <div class="overflow-x-auto px-4 py-3" tabindex="0" role="region" aria-label=${title}>
        <pre class="m-0 font-mono text-[12.5px] leading-[1.8] text-foreground">${lines.map(([t, n]) => html`${t}${n ? html`<span class="text-muted-foreground">  ${n}</span>` : ''}
`)}</pre>
      </div>
    </div>
  `;
}

/** Terms and definitions in two columns. */
export function glossary(items: [term: string, def: unknown][]) {
  return html`
    <dl class="m-0 grid gap-x-12 md:grid-cols-2">
      ${items.map(([term, def], i) => html`
        <div class="min-w-0 py-5 ${i > 0 ? 'border-t border-border' : ''} ${i === 1 ? 'md:border-t-0' : ''}">
          <dt class="m-0 font-mono text-[13px] font-semibold text-foreground">${term}</dt>
          <dd class="m-0 mt-2 max-w-[60ch] text-sm leading-[1.7] text-muted-foreground">${def}</dd>
        </div>
      `)}
    </dl>
  `;
}
