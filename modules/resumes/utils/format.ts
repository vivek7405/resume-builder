// Pure formatting helpers shared by the templates (server render) and the
// preview island (browser). No DOM, no server imports.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'YYYY-MM' to 'Mon YYYY'. Anything else is returned as typed. */
export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return value.trim();
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : m[1];
}

/** 'Apr 2023 – Present', 'Apr 2023 – Jun 2024', or a single side when only one is set. */
export function formatDateRange(start: string, end: string, current = false): string {
  const from = formatMonth(start);
  const to = current ? 'Present' : formatMonth(end);
  if (from && to) return `${from} – ${to}`;
  return from || to;
}

/** One highlight per line. Leading list markers and blank lines are dropped. */
export function toHighlights(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean);
}

/** Skills typed as a comma or newline separated list. Trimmed, deduplicated, capped. */
export function skillsFromText(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,\n]/)) {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
    if (out.length === 60) break;
  }
  return out;
}

/** 'Ada Lovelace' to 'AL'. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** A short relative time for the list: 'just now', '5m ago', '3h ago', '2d ago', else a date. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Strip a scheme for display: 'https://ada.dev/' to 'ada.dev'. */
export function displayUrl(url: string): string {
  return url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Make a typed link absolute so an <a href> leaves the app, not a relative path. */
export function hrefFor(url: string): string {
  const value = url.trim();
  if (!value) return '';
  return /^[a-z]+:/i.test(value) ? value : `https://${value}`;
}
