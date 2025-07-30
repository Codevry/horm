import type { Form } from '@/entity/entityForm.ts';

export function formsView(forms: Form[]) {
  return `
  <a href="/dashboard/forms/new" class="top-link">➕ Create New Form</a>
  <table>
    <tr><th>Name</th><th>Status</th><th>Toggle</th></tr>
    ${forms
      .map(
        f => `
      <tr>
        <td><a href="/dashboard/forms/${f.token}?name=${f.name}">${f.name}</a></td>
        <td>${f.isActive ? 'Enabled' : 'Disabled'}</td>
        <td>
          <form method="POST" action="/forms/${f.id}/toggle">
            <button type="submit">${f.isActive ? 'Disable' : 'Enable'}</button>
          </form>
        </td>
      </tr>
    `,
      )
      .join('')}
  </table>
`;
}
