import type { Form } from '@/entity/entityForm.ts';
import type { Records } from '@/entity/entityRecords.ts';
import type { FormStats, Pagination } from '@/controller/ctrlRecords.ts';
import { escapeHtml } from '@/utils/html.ts';
import { icon } from '@/views/icons.ts';
import { copyButton, formatDate, formatDateTime, intakeStrip, plural, relativeTime, status } from '@/views/parts.ts';

function renderCell(value: unknown): string {
  if (value === undefined || value === null || value === '') return '<span class="nil">—</span>';
  if (Array.isArray(value)) {
    if (value.every(v => typeof v !== 'object' || v === null))
      return `<div class="chips">${value.map(v => `<span class="chip">${escapeHtml(v)}</span>`).join('')}</div>`;
    return `<pre class="json mono">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  }
  if (typeof value === 'object') return `<pre class="json mono">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
  return escapeHtml(value);
}

function integration(form: Form, origin: string, open: boolean) {
  const endpoint = `${origin}/records`;
  const snippet = `<form id="contact">…</form>
<script>
  document.getElementById('contact').addEventListener('submit', async e => {
    e.preventDefault();
    await fetch('${endpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formToken: '${form.token}',
        data: Object.fromEntries(new FormData(e.target)),
      }),
    });
  });
</script>`;

  return `<details class="panel integration"${open ? ' open' : ''}>
    <summary>${icon('chevron', 'icon chev')}${icon('code')}Send submissions to this form</summary>
    <div class="body">
      <div class="endpoint">
        <span class="muted">POST</span><code>${escapeHtml(endpoint)}</code>${copyButton(endpoint, 'Copy URL')}
        <span class="muted">token</span><code>${escapeHtml(form.token)}</code>${copyButton(form.token, 'Copy token')}
      </div>
      <pre class="snippet mono">${copyButton(snippet, 'Copy')}<code>${escapeHtml(snippet)}</code></pre>
    </div>
  </details>`;
}

function pager(token: string, p: Pagination) {
  if (p.pages <= 1) return '';
  const href = (page: number) => `/dashboard/forms/${token}?page=${page}`;
  const from = (p.page - 1) * p.limit + 1;
  const to = Math.min(p.page * p.limit, p.total);
  const prev =
    p.page > 1
      ? `<a class="btn btn-sm" href="${href(p.page - 1)}" rel="prev">${icon('arrowLeft')}Newer</a>`
      : `<span class="btn btn-sm" aria-disabled="true">${icon('arrowLeft')}Newer</span>`;
  const next =
    p.page < p.pages
      ? `<a class="btn btn-sm" href="${href(p.page + 1)}" rel="next">Older${icon('chevron')}</a>`
      : `<span class="btn btn-sm" aria-disabled="true">Older${icon('chevron')}</span>`;

  return `<nav class="pager" aria-label="Submissions pages">
    <span class="muted num">${from}–${to} of ${p.total}</span>
    <span class="pager-pages num">Page ${p.page} of ${p.pages}</span>
    <div class="actions">${prev}${next}</div>
  </nav>`;
}

export function formRecordsView(
  form: Form,
  records: Records[],
  pagination: Pagination,
  stats: FormStats,
  start: Date,
  origin: string,
) {
  const token = encodeURIComponent(form.token);

  const head = `
  <a class="back" href="/dashboard">${icon('arrowLeft')}All forms</a>
  <header class="page-head">
    <div>
      <div class="page-title"><h1>${escapeHtml(form.name)}</h1>${status(form.isActive)}</div>
      <p class="page-meta"><span class="num">${plural(stats.total, 'submission')}</span>${
        stats.last ? ` · last ${relativeTime(stats.last)}` : ''
      } · created ${formatDate(form.createdAt)}</p>
    </div>
    ${stats.total ? `<div class="head-intake hide-sm" title="Submissions per day, last ${stats.daily.length} days">${intakeStrip(stats, start)}</div>` : ''}
    <div class="actions">
      ${
        records.length
          ? `<a class="btn" href="/dashboard/forms/${token}/export?format=csv" download>${icon('download')}CSV</a>
      <a class="btn" href="/dashboard/forms/${token}/export?format=json" download>${icon('download')}JSON</a>`
          : ''
      }
      <a class="btn" href="/dashboard/forms/${token}/settings">${icon('sliders')}Settings</a>
      <form method="POST" action="/dashboard/forms/${token}/toggle">
        <button type="submit" class="btn">${form.isActive ? `${icon('pause')}Pause form` : `${icon('play')}Resume form`}</button>
      </form>
    </div>
  </header>`;

  if (records.length === 0)
    return `${head}
  ${integration(form, origin, true)}
  <section class="panel empty">
    <h2>No submissions yet</h2>
    <p>${
      form.isActive
        ? 'Post your first submission with the snippet above. It will appear here straight away.'
        : 'This form is paused, so new submissions are rejected. Resume it to start collecting.'
    }</p>
  </section>`;

  // one column per field, in the order fields first appear
  const keys: string[] = [];
  for (const r of records) for (const k of Object.keys(r.data ?? {})) if (!keys.includes(k)) keys.push(k);

  const rows = records
    .map(
      r => `<tr>
        <td class="when"><time datetime="${r.createdAt.toISOString()}" title="${escapeHtml(formatDateTime(r.createdAt))}">${relativeTime(r.createdAt)}</time></td>
        ${keys.map(k => `<td>${renderCell(r.data?.[k])}</td>`).join('')}
      </tr>`,
    )
    .join('');

  return `${head}
  ${integration(form, origin, false)}
  <section class="panel">
    <div class="table-wrap">
      <table class="records">
        <thead>
          <tr>
            <th scope="col">Received</th>
            ${keys.map(k => `<th scope="col">${escapeHtml(k)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pager(token, pagination)}
  </section>`;
}
