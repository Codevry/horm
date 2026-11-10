import type { Records } from '@/entity/entityRecords.ts';
import { escapeHtml } from '@/utils/html.ts';

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `<ul>${value
      .map(item => `<li>${typeof item === 'object' && item !== null ? generateTable(item) : escapeHtml(item)}</li>`)
      .join('')}</ul>`;
  } else if (value instanceof Date) {
    return escapeHtml(value.toISOString());
  } else if (typeof value === 'object' && value !== null) {
    return generateTable(value as Record<string, unknown>);
  } else {
    return escapeHtml(value);
  }
}

function generateTable(obj: Record<string, unknown>): string {
  const rows = Object.entries(obj)
    .map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${renderValue(value)}</td></tr>`)
    .join('');

  return `<table border="1" cellspacing="0" cellpadding="4">${rows}</table>`;
}

export function generateHTMLTable(formToken: string, records: Records[]): string {
  const token = encodeURIComponent(formToken);
  const back = '<p><a href="/dashboard">← Back to forms</a></p>';
  if (records.length === 0) return `${back}<p>No records found.</p>`;

  return `
  ${back}
  <p>
    Download as:
    <a href="/dashboard/forms/${token}/export?format=csv">CSV</a> ·
    <a href="/dashboard/forms/${token}/export?format=json">JSON</a>
  </p>
  ${records
    .map(record => generateTable({ id: record.id, createdAt: record.createdAt, data: record.data }))
    .join('<br/>')}
  `;
}
