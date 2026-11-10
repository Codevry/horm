import type { Records } from '@/entity/entityRecords.ts';

/**
 * quote a single CSV cell, neutralising spreadsheet formula injection
 */
function csvCell(value: unknown): string {
  let text: string;
  if (value === null || value === undefined) text = '';
  else if (value instanceof Date) text = value.toISOString();
  else if (typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * convert records to CSV: one column per top-level key found in any record's data
 */
export function recordsToCsv(records: Records[]): string {
  const keys: string[] = [];
  for (const record of records) {
    for (const key of Object.keys(record.data ?? {})) if (!keys.includes(key)) keys.push(key);
  }

  const header = ['id', 'createdAt', ...keys].map(csvCell).join(',');
  const lines = records.map(record =>
    [record.id, record.createdAt, ...keys.map(key => record.data?.[key])].map(csvCell).join(','),
  );
  return [header, ...lines].join('\r\n') + '\r\n';
}

/**
 * make a string safe to use as a download file name
 */
export function safeFileName(name: string): string {
  return name.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'records';
}
