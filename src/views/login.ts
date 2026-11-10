import { escapeHtml } from '@/utils/html.ts';

export function loginView(error?: string) {
  return `
  ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
  <form method="POST" action="/dashboard/login">
    <input type="password" name="token" placeholder="Admin token" required autocomplete="current-password" />
    <button type="submit">Log in</button>
  </form>
  <p class="muted">The admin token is printed in the server logs on first start.</p>
`;
}
