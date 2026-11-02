import { html } from '@webjsdev/core';
import { ssrFixture } from '@webjsdev/core/testing';
import '../../../components/form-pending.ts';

const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };

suite('<form-pending>', () => {
  // A real form submit navigates the WTR session away, so cancel it at the window (bubble phase).
  const cancel = (e) => e.preventDefault();
  setup(() => window.addEventListener('submit', cancel));
  teardown(() => window.removeEventListener('submit', cancel));

  test('marks the form busy and swaps the submit label on submit', async () => {
    const el = await ssrFixture(html`
      <form-pending>
        <form action="/nowhere" method="post">
          <button type="submit" data-pending="Generating…">Generate</button>
        </form>
      </form-pending>`);
    const form = el.querySelector('form');
    const button = el.querySelector('button');
    form.requestSubmit(button);
    await new Promise((r) => setTimeout(r, 0));
    assert(form.getAttribute('aria-busy') === 'true', 'form is busy');
    assert(button.textContent === 'Generating…', `label swapped, got ${button.textContent}`);
    assert(button.disabled, 'button disabled after the submit left');
  });
});
