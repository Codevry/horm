import { escapeHtml } from '@/utils/html.ts';
import { brandMark, icon } from '@/views/icons.ts';

export function loginView(error?: string) {
  return `<main class="auth">
  <form method="POST" action="/dashboard/login" class="panel auth-card">
    <span class="brand">${brandMark}<span>horm</span></span>
    <h1>Sign in to your dashboard</h1>
    <div class="field">
      <label for="token">Admin token</label>
      <input class="input mono" id="token" type="password" name="token" required autofocus
        autocomplete="current-password" spellcheck="false"${error ? ' aria-invalid="true" aria-describedby="token-error"' : ''} />
      ${
        error
          ? `<p class="error" id="token-error">${icon('alert')}${escapeHtml(error)}</p>`
          : '<p class="hint">Horm prints the admin token in its logs the first time it starts.</p>'
      }
    </div>
    <button type="submit" class="btn btn-primary">Sign in</button>
  </form>
</main>`;
}
