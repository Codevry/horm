import { escapeHtml } from '@/utils/html.ts';
import { icon } from '@/views/icons.ts';
import type { NavForm } from '@/views/layout.ts';
import { copyButton, intakeStrip, plural, relativeTime, status } from '@/views/parts.ts';

function toggleButton(token: string, active: boolean) {
  return `<form method="POST" action="/dashboard/forms/${encodeURIComponent(token)}/toggle">
    <button type="submit" class="btn btn-sm">${active ? `${icon('pause')}Pause` : `${icon('play')}Resume`}</button>
  </form>`;
}

export function formsView(forms: NavForm[], start: Date, days: number) {
  const recent = forms.reduce((n, f) => n + f.stats.daily.reduce((a, b) => a + b, 0), 0);
  const paused = forms.filter(f => !f.form.isActive).length;

  const head = `
  <header class="page-head">
    <div>
      <h1>Forms</h1>
      <p class="page-meta">${
        forms.length
          ? `${plural(forms.length, 'form')}${paused ? `, ${paused} paused` : ''} · <span class="num">${plural(recent, 'submission')}</span> in the last ${days} days`
          : 'Create a form, then point your HTML form at it.'
      }</p>
    </div>
    <a href="/dashboard/forms/new" class="btn btn-primary">${icon('plus')}New form</a>
  </header>`;

  if (forms.length === 0)
    return `${head}
  <section class="panel empty">
    <h2>No forms yet</h2>
    <p>Each form gets a token. Your website posts submissions with that token, and they show up here.</p>
    <a href="/dashboard/forms/new" class="btn btn-primary">${icon('plus')}Create your first form</a>
  </section>`;

  const rows = forms
    .map(({ form, stats }) => {
      const href = `/dashboard/forms/${encodeURIComponent(form.token)}`;
      return `
      <tr>
        <td>
          <a class="form-name" href="${href}">${escapeHtml(form.name)}</a>
          <div class="token"><code>${escapeHtml(form.token)}</code>${copyButton(form.token, undefined, 'Copy token')}</div>
        </td>
        <td class="middle hide-sm">${intakeStrip(stats, start)}</td>
        <td class="middle right num">${stats.total}</td>
        <td class="middle muted hide-sm">${
          stats.last
            ? `<time datetime="${stats.last.toISOString()}" title="${stats.last.toISOString()}">${relativeTime(stats.last)}</time>`
            : '<span class="nil">Never</span>'
        }</td>
        <td class="middle">${status(form.isActive)}</td>
        <td class="middle right hide-sm">${toggleButton(form.token, form.isActive)}</td>
      </tr>`;
    })
    .join('');

  return `${head}
  <section class="panel">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Form</th>
            <th scope="col" class="hide-sm">Last ${days} days</th>
            <th scope="col" class="right">Total</th>
            <th scope="col" class="hide-sm">Last submission</th>
            <th scope="col">Status</th>
            <th scope="col" class="right hide-sm"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

export function newFormView(error?: string, value = '') {
  return `
  <a class="back" href="/dashboard">${icon('arrowLeft')}All forms</a>
  <header class="page-head">
    <div>
      <h1>New form</h1>
      <p class="page-meta">You'll get a token to send submissions to.</p>
    </div>
  </header>
  <form method="POST" action="/dashboard/forms" class="panel panel-pad stack narrow">
    <div class="field">
      <label for="name">Form name</label>
      <input class="input" id="name" type="text" name="name" value="${escapeHtml(value)}" placeholder="Contact us"
        required maxlength="255" autofocus${error ? ' aria-invalid="true" aria-describedby="name-error"' : ''} />
      ${
        error
          ? `<p class="error" id="name-error">${icon('alert')}${escapeHtml(error)}</p>`
          : '<p class="hint">Only you see this name. You can pause the form at any time.</p>'
      }
    </div>
    <div class="form-actions">
      <a href="/dashboard" class="btn">Cancel</a>
      <button type="submit" class="btn btn-primary">Create form</button>
    </div>
  </form>`;
}
