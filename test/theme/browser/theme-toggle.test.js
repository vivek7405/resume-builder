import { html } from '@webjsdev/core';
import { ssrFixture, assertNoA11yViolations } from '@webjsdev/core/testing';
import '../../../components/theme-toggle.ts';

const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };

suite('<theme-toggle>', () => {
  teardown(() => {
    try { localStorage.removeItem('folio_theme'); } catch {}
    delete document.documentElement.dataset.theme;
    document.documentElement.classList.remove('dark');
  });

  test('cycles system, light, dark and writes the document theme', async () => {
    const el = await ssrFixture(html`<theme-toggle></theme-toggle>`);
    const button = el.querySelector('button');
    assert(button, 'renders a button');
    assert(/system/.test(button.getAttribute('aria-label')), 'starts on system');

    button.click();
    await el.updateComplete;
    assert(document.documentElement.dataset.theme === 'light', 'first click forces light');
    assert(!document.documentElement.classList.contains('dark'), 'light drops .dark');
    assert(localStorage.getItem('folio_theme') === 'light', 'persists light');

    el.querySelector('button').click();
    await el.updateComplete;
    assert(document.documentElement.dataset.theme === 'dark', 'second click forces dark');
    assert(document.documentElement.classList.contains('dark'), 'dark adds .dark');

    el.querySelector('button').click();
    await el.updateComplete;
    assert(!('theme' in document.documentElement.dataset), 'third click returns to system');
    assert(localStorage.getItem('folio_theme') === null, 'system clears the saved choice');
  });

  test('has an accessible name and no a11y violations', async () => {
    const el = await ssrFixture(html`<theme-toggle></theme-toggle>`);
    await assertNoA11yViolations(el);
  });
});
