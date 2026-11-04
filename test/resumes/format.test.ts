import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMonth, formatDateRange, toHighlights, skillsFromText, initials, timeAgo, displayUrl, hrefFor } from '#modules/resumes/utils/format.ts';
import { profileFromForm, settingsFromForm, entryFromForm, skillsFromForm, targetFromForm } from '#modules/resumes/utils/parse-section.ts';
import { ACCENTS, emptyEntry } from '#modules/resumes/types.ts';

test('formatMonth turns YYYY-MM into Mon YYYY and leaves other text alone', () => {
  assert.equal(formatMonth('2023-04'), 'Apr 2023');
  assert.equal(formatMonth('2023-13'), '2023');
  assert.equal(formatMonth('Summer 2023'), 'Summer 2023');
  assert.equal(formatMonth(''), '');
});

test('formatDateRange handles current, closed and one-sided ranges', () => {
  assert.equal(formatDateRange('2021-03', '', true), 'Mar 2021 – Present');
  assert.equal(formatDateRange('2017-06', '2021-02'), 'Jun 2017 – Feb 2021');
  assert.equal(formatDateRange('', '2021-02'), 'Feb 2021');
  assert.equal(formatDateRange('', '', false), '');
});

test('toHighlights splits lines and strips list markers', () => {
  assert.deepEqual(toHighlights('- one\n• two\n\n  * three  \n'), ['one', 'two', 'three']);
});

test('skillsFromText splits on commas and newlines, trims, dedupes case-insensitively', () => {
  assert.deepEqual(skillsFromText('Go, go ,TypeScript\n\nRedis,'), ['Go', 'TypeScript', 'Redis']);
});

test('initials takes the first two words', () => {
  assert.equal(initials('Maya Okafor'), 'MO');
  assert.equal(initials('  ada  '), 'A');
  assert.equal(initials(''), '');
});

test('timeAgo buckets recent dates and falls back to a date', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  assert.equal(timeAgo(new Date('2026-11-02T11:59:50Z'), now), 'just now');
  assert.equal(timeAgo(new Date('2026-11-02T11:40:00Z'), now), '20m ago');
  assert.equal(timeAgo(new Date('2026-11-02T07:00:00Z'), now), '5h ago');
  assert.equal(timeAgo(new Date('2026-10-30T12:00:00Z'), now), '3d ago');
  assert.match(timeAgo(new Date('2026-01-15T12:00:00Z'), now), /2026/);
});

test('displayUrl and hrefFor normalise links', () => {
  assert.equal(displayUrl('https://ada.dev/'), 'ada.dev');
  assert.equal(hrefFor('ada.dev'), 'https://ada.dev');
  assert.equal(hrefFor('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(hrefFor('  '), '');
});

function fd(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(entries)) data.set(k, v);
  return data;
}

test('profileFromForm trims and caps fields', () => {
  const profile = profileFromForm(fd({ fullName: '  Maya Okafor ', email: 'maya@okafor.dev', summary: 'x'.repeat(5000) }));
  assert.equal(profile.fullName, 'Maya Okafor');
  assert.equal(profile.headline, '');
  assert.equal(profile.summary.length, 4000);
});

test('settingsFromForm falls back to a known template and accent', () => {
  const ok = settingsFromForm(fd({ title: 'Mine', template: 'modern', accent: ACCENTS[2].hex.toUpperCase() }));
  assert.deepEqual(ok, { title: 'Mine', template: 'modern', accent: ACCENTS[2].hex });
  const bad = settingsFromForm(fd({ template: 'nope', accent: '#123456' }));
  assert.deepEqual(bad, { title: '', template: 'classic', accent: ACCENTS[0].hex });
});

test('settingsFromForm keeps the Crimson accent', () => {
  assert.equal(settingsFromForm(fd({ accent: '#a3243b' })).accent, '#a3243b');
});

test('every accent is a lowercase #rrggbb, the only form settingsFromForm can match', () => {
  for (const a of ACCENTS) assert.match(a.hex, /^#[0-9a-f]{6}$/);
});

test('entryFromForm reads each section shape and validates months', () => {
  const exp = entryFromForm('experience', fd({ company: 'Lumen', role: 'Eng', start: '2021-03', end: 'bad', current: 'on', highlights: 'a\nb' }));
  assert.deepEqual(exp, { company: 'Lumen', role: 'Eng', location: '', start: '2021-03', end: '', current: true, highlights: 'a\nb' });
  const edu = entryFromForm('education', fd({ school: 'Edinburgh', degree: 'BSc' }));
  assert.deepEqual(edu, { ...emptyEntry('education'), school: 'Edinburgh', degree: 'BSc' });
  const proj = entryFromForm('projects', fd({ name: 'ledgerkit', link: 'github.com/x' }));
  assert.deepEqual(proj, { name: 'ledgerkit', link: 'github.com/x', description: '' });
});

test('skillsFromForm and targetFromForm read the envelope fields', () => {
  assert.deepEqual(skillsFromForm(fd({ skills: 'Go, Rust' })), ['Go', 'Rust']);
  assert.deepEqual(targetFromForm(fd({ resumeId: 'abc', section: 'experience', index: '2' })), { resumeId: 'abc', section: 'experience', index: 2 });
  assert.equal(targetFromForm(fd({ index: '-4' })).index, 0);
});
