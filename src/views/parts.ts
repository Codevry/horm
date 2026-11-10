import { escapeHtml } from '@/utils/html.ts';
import { icon } from '@/views/icons.ts';
import type { FormStats } from '@/controller/ctrlRecords.ts';

const dayFmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateFmt = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);

/**
 * "just now", "5 min ago", "3 h ago", "2 days ago", then a date
 */
export function relativeTime(date: Date | null, now = Date.now()): string {
  if (!date) return '';
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  const days = Math.floor(s / 86_400);
  if (days < 7) return days === 1 ? 'yesterday' : `${days} days ago`;
  return formatDate(date);
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * status pill
 */
export function status(active: boolean) {
  return active ? '<span class="status on">Accepting</span>' : '<span class="status off">Paused</span>';
}

/**
 * small copy button; `label` is shown next to the icon when given
 */
export function copyButton(value: string, label?: string, srLabel = 'Copy') {
  return `<button type="button" class="copy" data-copy="${escapeHtml(value)}" title="${escapeHtml(srLabel)}">
    ${icon('copy')}${label ? `<span class="copy-label">${escapeHtml(label)}</span>` : `<span class="sr-only">${escapeHtml(srLabel)}</span>`}
  </button>`;
}

/**
 * signature: one bar per day for the last N days, today in the accent colour
 */
export function intakeStrip(stats: FormStats, start: Date) {
  const barW = 5;
  const gap = 3;
  const h = 26;
  const max = Math.max(1, ...stats.daily);
  const last = stats.daily.length - 1;
  const sum = stats.daily.reduce((a, b) => a + b, 0);

  const bars = stats.daily
    .map((count, i) => {
      const day = new Date(start.getTime() + i * 86_400_000);
      const x = i * (barW + gap);
      const title = `<title>${dayFmt.format(day)}: ${plural(count, 'submission')}</title>`;
      if (count === 0)
        return `<rect class="empty" x="${x}" y="${h - 2}" width="${barW}" height="2" rx="1">${title}</rect>`;
      const bh = Math.max(4, Math.round((count / max) * h));
      return `<rect class="${i === last ? 'today' : ''}" x="${x}" y="${h - bh}" width="${barW}" height="${bh}" rx="1.5" style="animation-delay:${i * 18}ms">${title}</rect>`;
    })
    .join('');

  const width = stats.daily.length * (barW + gap) - gap;
  return `<div class="intake">
    <svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${plural(sum, 'submission')} in the last ${stats.daily.length} days">${bars}</svg>
    <span class="intake-total num" aria-hidden="true">${sum}</span>
  </div>`;
}
