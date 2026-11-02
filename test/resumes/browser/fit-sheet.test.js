import { html } from '@webjsdev/core';
import { ssrFixture } from '@webjsdev/core/testing';
import '../../../components/fit-sheet.ts';

const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

suite('<fit-sheet>', () => {
  test('scales the slotted sheet to its own width and sizes the frame to the sheet', async () => {
    const el = await ssrFixture(html`
      <div style="width: 397px">
        <fit-sheet class="block w-full" style="--s-guess: 0.4">
          <article class="resume-sheet" style="width: 210mm; height: 100mm; background: white">Sheet</article>
        </fit-sheet>
      </div>`);
    const sheet = el.querySelector('fit-sheet');
    await sheet.updateComplete;
    await nextFrame();
    const frame = sheet.querySelector('[data-frame]');
    const scale = Number(getComputedStyle(frame).getPropertyValue('--s'));
    assert(Math.abs(scale - 0.5) < 0.02, `scale should be ~0.5 for a 397px host, got ${scale}`);
    const expected = sheet.querySelector('.resume-sheet').offsetHeight * scale;
    assert(Math.abs(parseFloat(frame.style.height) - expected) < 2, `frame height ${frame.style.height} should match ${expected}`);
    assert(sheet.querySelector('.resume-sheet').getBoundingClientRect().width < 400, 'the sheet renders scaled down');
  });
});
