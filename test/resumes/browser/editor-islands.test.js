import { html } from '@webjsdev/core';
import { ssrFixture } from '@webjsdev/core/testing';
import '../../../modules/resumes/components/resume-preview.ts';
import '../../../modules/resumes/components/draft-form.ts';
import { draft, baseDocument, resetDraft } from '../../../modules/resumes/draft.ts';
import { SAMPLE_RESUMES } from '../../../modules/resumes/utils/sample-data.ts';

const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

suite('editor islands', () => {
  // A real form submit navigates the WTR session away; cancel it at the window (bubble phase).
  const cancel = (e) => e.preventDefault();
  setup(() => window.addEventListener('submit', cancel));
  teardown(() => { window.removeEventListener('submit', cancel); resetDraft(); });

  test('<resume-preview> renders the seeded document and follows the draft', async () => {
    const doc = SAMPLE_RESUMES[0].doc;
    const el = await ssrFixture(html`<resume-preview .resume=${doc}></resume-preview>`);
    assert(el.querySelector('h1').textContent.includes('Maya Okafor'), 'renders the seeded name');
    assert(baseDocument.get() && baseDocument.get().profile.fullName === 'Maya Okafor', 'publishes the base document');

    draft.set({ profile: { ...doc.profile, fullName: 'Ada Lovelace' }, template: 'minimal' });
    await el.updateComplete;
    assert(el.querySelector('h1').textContent.includes('Ada Lovelace'), 'the draft name is on the sheet');
    assert(el.querySelector('.resume-sheet').className.includes('px-[18mm]'), 'minimal keeps the padded sheet');
  });

  test('<draft-form> mirrors input into the draft and reports the save result', async () => {
    const el = await ssrFixture(html`
      <draft-form section="experience" index="0">
        <form>
          <input type="hidden" name="resumeId" value="does-not-exist">
          <input type="hidden" name="section" value="experience">
          <input type="hidden" name="index" value="0">
          <input name="role" value="Senior Backend Engineer">
          <input name="company" value="Lumen Pay">
          <input type="month" name="start" value="2021-03">
          <input type="month" name="end" value="">
          <input type="checkbox" name="current">
          <textarea name="highlights">one</textarea>
          <button type="submit">Save</button>
        </form>
      </draft-form>`);
    // After the fixture: creating it tears the previous one down, and the
    // previous test's preview resets the draft when it disconnects.
    baseDocument.set({ ...SAMPLE_RESUMES[0].doc });
    const role = el.querySelector('input[name="role"]');
    role.value = 'Staff Engineer';
    role.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;
    assert(draft.get().experience[0].role === 'Staff Engineer', 'the draft has the typed role');
    assert(draft.get().experience[1].company === 'Northwind Logistics', 'other entries come from the base document');
    assert(el.querySelector('[data-status]').dataset.status === 'dirty', 'status is dirty right after typing');

    const current = el.querySelector('input[name="current"]');
    current.checked = true;
    current.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    assert(el.querySelector('input[name="end"]').disabled, 'a current role disables the end month');

    // The autosave fires after the pause; the resume does not exist, so the action answers with an error.
    await tick(1200);
    await el.updateComplete;
    const status = el.querySelector('[data-status]');
    assert(status.dataset.status === 'error', `expected an error status after saving a missing resume, got ${status.dataset.status}`);
    assert(/no longer exists/.test(status.textContent), `shows the action's message, got "${status.textContent}"`);
  });
});
