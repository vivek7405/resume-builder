import { html, cspNonce, asset } from '@webjsdev/core';
import type { LayoutProps } from '@webjsdev/core';

/**
 * Root layout: the ONLY file that writes the document shell. It carries the
 * head only (fonts, design tokens, the theme and header-measure scripts, the
 * print stylesheet, the Tailwind link). The app chrome lives in the (app)
 * route group's layout, so the print view under (print) renders bare.
 *
 * Tokens are plain CSS custom properties written ONCE with light-dark(), so
 * they resolve with JavaScript disabled, and public/input.css maps them into
 * Tailwind utilities (bg-background, text-muted-foreground, border-border).
 */
export default function RootLayout({ children }: LayoutProps) {
  const nonce = cspNonce();
  return html`
    <script nonce="${nonce}">
      // Theme: apply the saved choice before first paint so nothing flashes.
      // [data-theme] forces a scheme, otherwise the OS decides. The .dark
      // class is kept in sync for the ui kit's dark: utilities.
      (function(){
        try {
          var mq = window.matchMedia('(prefers-color-scheme: dark)');
          function apply(){
            var t = null;
            try { t = localStorage.getItem('folio_theme'); } catch (_) {}
            var el = document.documentElement;
            if (t === 'light' || t === 'dark') el.dataset.theme = t;
            else delete el.dataset.theme;
            el.classList.toggle('dark', t === 'dark' || (t !== 'light' && mq.matches));
          }
          apply();
          mq.addEventListener('change', apply);
        } catch (_) {}
      })();
      // A fixed header leaves normal flow, so its measured height is reserved
      // on the body through --header-h. No header means a no-op.
      (function(){
        function measure(){
          try {
            var hdr = document.querySelector('header[data-app-header]');
            if (!hdr) return;
            var apply = function(){
              document.documentElement.style.setProperty('--header-h', hdr.offsetHeight + 'px');
            };
            apply();
            if (window.ResizeObserver) new ResizeObserver(apply).observe(hdr);
          } catch (_) {}
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', measure);
        else measure();
      })();
    </script>
    <meta name="color-scheme" content="light dark">
    <meta name="theme-color" content="#fbfaf8" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#121211" media="(prefers-color-scheme: dark)">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
    <link rel="stylesheet" href=${asset('/public/tailwind.css')}>
    <style>
      :root {
        --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        --font-serif: 'Source Serif 4', ui-serif, Georgia, 'Times New Roman', serif;
        --font-display: 'Instrument Serif', 'Source Serif 4', ui-serif, Georgia, serif;
        --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        --header-h: 0px;
        --radius: 0.75rem;

        color-scheme: light dark;
        --background:             light-dark(#fbfaf8, #121211);
        --foreground:             light-dark(#1c1b19, #ebe8e2);
        --card:                   light-dark(#ffffff, #1a1a18);
        --card-foreground:        light-dark(#1c1b19, #ebe8e2);
        --popover:                light-dark(#ffffff, #1a1a18);
        --popover-foreground:     light-dark(#1c1b19, #ebe8e2);
        --primary:                light-dark(#1c1b19, #ebe8e2);
        --primary-foreground:     light-dark(#fbfaf8, #121211);
        --secondary:              light-dark(#f1efeb, #242321);
        --secondary-foreground:   light-dark(#1c1b19, #ebe8e2);
        --muted:                  light-dark(#f1efeb, #1f1e1c);
        --muted-foreground:       light-dark(#6b675f, #9a958c);
        --accent:                 light-dark(#ebe8e2, #2a2927);
        --accent-foreground:      light-dark(#1c1b19, #f4f2ee);
        --destructive:            light-dark(#b42318, #f2a39b);
        --destructive-foreground: light-dark(#ffffff, #121211);
        --border:                 light-dark(#e6e2db, #2d2c29);
        --border-strong:          light-dark(#cfcac1, #3d3b37);
        --input:                  light-dark(#dcd8d0, #34332f);
        --ring:                   light-dark(#8d887e, #6f6a62);
        --primary-tint: color-mix(in srgb, var(--primary) 14%, transparent);
        /* The resume sheet is paper in both themes. */
        --paper: #ffffff;
        --paper-foreground: #1c1b19;
        --paper-muted: #6b675f;
        --paper-line: #e6e2db;
      }
      :root[data-theme='light'] { color-scheme: light; }
      :root[data-theme='dark']  { color-scheme: dark; }

      html, body { margin: 0; }
      body {
        padding-top: var(--header-h);
        background: var(--background);
        color: var(--foreground);
        font: 15px/1.6 var(--font-sans);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      ::selection { background: var(--primary-tint); }

      /* <fit-sheet> (components/fit-sheet.ts): the host is a size container and
         its frame scales a 210mm sheet to the host width in pure CSS, so the
         first paint is exact. Without typed arithmetic the page's guess applies. */
      fit-sheet { container-type: inline-size; }
      fit-sheet > [data-frame] { --s: var(--s-guess, 0.4); }
      @supports (opacity: calc(1px / 1px)) {
        fit-sheet > [data-frame] { --s: calc(100cqw / 210mm); }
      }

      /* Tints and accents print without the browser's Background graphics option. */
      .resume-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

      /* Print: the resume sheet alone, on A4, with no chrome. */
      @page { size: A4; margin: 0; }
      @media print {
        html, body { background: #ffffff !important; padding: 0 !important; }
        .no-print { display: none !important; }
        /* The screen wrappers (min-h-dvh, flex, overflow-x-auto) add a blank page. */
        .print-flow { display: block !important; min-height: 0 !important; max-width: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; background: #ffffff !important; box-shadow: none !important; }
        /* Just under A4, so a one-page resume fills the page without spilling over. */
        .resume-sheet { margin: 0 !important; width: 210mm !important; min-height: 296mm !important; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    </style>
    ${children}
  `;
}
