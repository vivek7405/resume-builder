import { html } from '@webjsdev/core';
import { buttonClass } from '#components/ui/button.ts';

export default function NotFound() {
  return html`
    <div class="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <p class="m-0 font-display text-6xl leading-none text-muted-foreground">404</p>
      <h1 class="m-0 text-xl font-semibold tracking-tight">That page is not here</h1>
      <p class="m-0 text-muted-foreground">The resume may have been deleted, or the link is wrong.</p>
      <a href="/resumes" class=${buttonClass({ variant: 'outline' })}>Back to resumes</a>
    </div>
  `;
}
