import type { Form } from '@/entity/entityForm.ts';
import { escapeHtml } from '@/utils/html.ts';

export function formsView(forms: Form[]) {
  const rows = forms
    .map(f => {
      const token = encodeURIComponent(f.token);
      return `
      <tr>
        <td><a href="/dashboard/forms/${token}">${escapeHtml(f.name)}</a></td>
        <td><code>${escapeHtml(f.token)}</code></td>
        <td>${f.isActive ? 'Enabled' : 'Disabled'}</td>
        <td>
          <form method="POST" action="/dashboard/forms/${token}/toggle">
            <button type="submit">${f.isActive ? 'Disable' : 'Enable'}</button>
          </form>
        </td>
      </tr>`;
    })
    .join('');

  return `
  <a href="/dashboard/forms/new" class="top-link">➕ Create New Form</a>
  ${
    forms.length === 0
      ? '<p class="muted">No forms yet.</p>'
      : `<table>
    <tr><th>Name</th><th>Token</th><th>Status</th><th>Toggle</th></tr>
    ${rows}
  </table>`
  }
`;
}

export function newFormView(error?: string) {
  return `
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
  <form method="POST" action="/dashboard/forms">
    <input type="text" name="name" placeholder="Form name" required maxlength="255" />
    <button type="submit">Create</button>
  </form>
  <p><a href="/dashboard">← Back to forms</a></p>
`;
}
