// End to end in a real browser: create a resume, type a name and watch the
// live preview follow, open the print view. Boots the dev server on a free
// port, drives it with puppeteer-core. Run with WEBJS_E2E=1 (CI does).
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';

type ElementHandle = { click(): Promise<void>; type(text: string, opts?: { delay?: number }): Promise<void> };
type Page = {
  goto(url: string, opts?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
  $(selector: string): Promise<ElementHandle | null>;
  waitForSelector(selector: string, opts?: { timeout?: number }): Promise<ElementHandle | null>;
  waitForFunction(fn: string, opts?: { timeout?: number }): Promise<unknown>;
  waitForNavigation(opts?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  evaluate<T>(fn: string): Promise<T>;
  on(event: string, handler: (e: Error) => void): void;
  pdf(opts: { preferCSSPageSize?: boolean }): Promise<Uint8Array>;
  setViewport(v: { width: number; height: number }): Promise<void>;
};
type Browser = { newPage(): Promise<Page>; close(): Promise<void>; process(): ChildProcess | null };
type Puppeteer = { launch(opts: { executablePath?: string; headless?: boolean; args?: string[] }): Promise<Browser> };

let browser: Browser, page: Page, serverProcess: ChildProcess, baseUrl: string;
const errors: string[] = [];

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

before(async () => {
  if (!process.env.WEBJS_E2E) return;
  let puppeteer: Puppeteer | undefined;
  // @ts-ignore puppeteer-core is an optional dev dependency
  try { puppeteer = (await import('puppeteer-core')).default; }
  catch { console.log('# Skipping: puppeteer-core not installed'); return; }
  if (!puppeteer) return;

  const port = await freePort();
  baseUrl = `http://localhost:${port}`;
  // The binary itself in its own process group, so teardown can kill the whole
  // tree. A survivor holding these pipes would keep the test process from exiting.
  serverProcess = spawn(join(process.cwd(), 'node_modules/.bin/webjs'), ['dev', '--port', String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, __WEBJS_DEV_CHILD: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  await new Promise<void>((resolve, reject) => {
    const onData = (chunk: Buffer) => { if (chunk.toString().includes('ready on')) resolve(); };
    serverProcess.stdout?.on('data', onData);
    serverProcess.stderr?.on('data', onData);
    setTimeout(() => reject(new Error('Server start timeout')), 20000).unref();
  });

  browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
  });
  page = await browser.newPage();
  page.on('pageerror', (e: Error) => errors.push(e.message));
}, { timeout: 60000 });

after(async () => {
  if (browser) {
    const closing = browser.process();
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000).unref())]);
    closing?.kill('SIGKILL');
  }
  if (serverProcess?.pid) {
    try { process.kill(-serverProcess.pid, 'SIGKILL'); } catch {}
    serverProcess.stdout?.destroy();
    serverProcess.stderr?.destroy();
    serverProcess.unref();
  }
}, { timeout: 15000 });

// A hard ceiling, so a stuck step fails with a message instead of hanging the job.
describe('E2E: resume flow', { skip: !process.env.WEBJS_E2E && 'set WEBJS_E2E=1 to run', timeout: 180000 }, () => {
  let editorUrl = '';

  test('create a resume from the new page', async () => {
    await page.goto(`${baseUrl}/resumes/new`, { waitUntil: 'networkidle0', timeout: 20000 });
    const title = await page.$('#title');
    assert.ok(title, 'the name field renders');
    await title.type('E2E: live preview');
    const minimal = await page.$('input[name="template"][value="minimal"]');
    assert.ok(minimal);
    await page.evaluate('document.querySelector(\'input[name="template"][value="minimal"]\').click()');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
      page.evaluate('document.querySelector(\'form button[type="submit"]\').click()'),
    ]);
    editorUrl = page.url();
    assert.match(editorUrl, /\/resumes\/[0-9a-f-]{36}$/);
    assert.match(await page.title(), /E2E: live preview/);
  });

  test('typing a name updates the preview at once and autosaves', async () => {
    await page.waitForSelector('resume-preview h1', { timeout: 10000 });
    await page.waitForFunction('customElements.get("draft-form") && customElements.get("resume-preview")', { timeout: 10000 });
    const name = await page.$('#fullName');
    assert.ok(name);
    await name.type('Ada Lovelace', { delay: 15 });
    await page.waitForFunction('document.querySelector("resume-preview h1").textContent.includes("Ada Lovelace")', { timeout: 5000 });
    await page.waitForFunction('document.querySelector(\'draft-form[section="profile"] [data-status]\').dataset.status === "saved"', { timeout: 10000 });

    // A fresh load shows the saved name without any draft in play.
    await page.goto(editorUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    const value = await page.evaluate<string>('document.querySelector("#fullName").value');
    assert.equal(value, 'Ada Lovelace');
  });

  test('the print view renders the sheet without the app chrome', async () => {
    await page.goto(`${editorUrl}/preview`, { waitUntil: 'networkidle0', timeout: 20000 });
    assert.match(await page.title(), /Ada Lovelace/);
    const hasHeader = await page.evaluate<boolean>('!!document.querySelector("header[data-app-header]")');
    assert.equal(hasHeader, false);
    const sheetText = await page.evaluate<string>('document.querySelector(".resume-sheet").textContent');
    assert.match(sheetText, /Ada Lovelace/);
  });

  test('a short resume prints to exactly one A4 page in every template', async () => {
    const id = editorUrl.split('/').pop();
    for (const template of ['classic', 'modern', 'minimal']) {
      await page.goto(editorUrl, { waitUntil: 'networkidle0', timeout: 20000 });
      await page.evaluate(`document.querySelector('input[name="template"][value="${template}"]').click()`);
      await page.waitForFunction('document.querySelector(\'draft-form[section="settings"] [data-status]\').dataset.status === "saved"', { timeout: 10000 });
      await page.goto(`${baseUrl}/resumes/${id}/preview`, { waitUntil: 'networkidle0', timeout: 20000 });
      const pdf = Buffer.from(await page.pdf({ preferCSSPageSize: true })).toString('latin1');
      const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      assert.equal(pages, 1, `${template} printed ${pages} pages`);
    }
  });

  test('the editor has no horizontal page scroll at phone width', async () => {
    await page.setViewport({ width: 390, height: 800 });
    await page.goto(editorUrl, { waitUntil: 'networkidle0', timeout: 20000 });
    const overflow = await page.evaluate<number>('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    await page.setViewport({ width: 1280, height: 800 });
    assert.ok(overflow <= 0, `the page overflows by ${overflow}px`);
  });

  test('deleting the resume from its confirmation page removes it', async () => {
    await page.goto(`${editorUrl}/delete`, { waitUntil: 'networkidle0', timeout: 20000 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
      page.evaluate('document.querySelector(\'main form button[type="submit"]\').click()'),
    ]);
    assert.match(page.url(), /\/resumes$/);
  });

  test('no JavaScript errors across the flow', () => {
    assert.deepEqual(errors, []);
  });
});
