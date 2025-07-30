import type { Records } from '@/entity/entityRecords.ts';

export function generateHTMLTable(records: Records[]): string {
  if (records.length === 0) return '<p>No records found.</p>';

  function renderValue(value: any): string {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(item => (typeof item === 'object' ? generateTable(item) : `<li>${item}</li>`)).join('');
    } else if (typeof value === 'object' && value !== null) {
      return generateTable(value);
    } else {
      return String(value);
    }
  }

  function generateTable(obj: Records): string {
    const rows = Object.entries(obj)
      .map(([key, value]) => `<tr><th>${key}</th><td>${renderValue(value)}</td></tr>`)
      .join('');

    return `<table border="1" cellspacing="0" cellpadding="4">${rows}</table>`;
  }

  return `
  <table>
     <tr>
         <td> Download as :  
              <form method="POST" action="/forms/toggle">
                 <button type="submit">CSV</button>
              </form>
              <form method="POST" action="/forms/toggle">
                 <button type="submit">JSON</button>
              </form>
         </td>
     </tr>
  </table>

  <br/>
  ${records.map(record => generateTable(record)).join('<br/>')}
  `;
}
