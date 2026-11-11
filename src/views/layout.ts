import { escapeHtml } from '@/utils/html.ts';
import { brandMark, icon } from '@/views/icons.ts';
import type { Form } from '@/entity/entityForm.ts';
import type { FormStats } from '@/controller/ctrlRecords.ts';

export interface NavForm {
  form: Form;
  stats: FormStats;
}

// copy-to-clipboard for any element with data-copy="text"
const script = `
document.addEventListener('click', async e => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.copy);
    const label = btn.querySelector('.copy-label');
    const prev = label && label.textContent;
    btn.setAttribute('data-copied', '');
    if (label) label.textContent = 'Copied';
    setTimeout(() => { btn.removeAttribute('data-copied'); if (label) label.textContent = prev; }, 1600);
  } catch {}
});

// ask before destructive submits (button or form with data-confirm)
document.addEventListener('submit', e => {
  const msg = (e.submitter && e.submitter.dataset.confirm) || e.target.dataset.confirm;
  if (msg && !confirm(msg)) e.preventDefault();
});

// submissions table: select all + "Delete selected" state
const bulk = document.querySelector('[data-bulk]');
if (bulk) {
  const boxes = () => [...document.querySelectorAll('input[name="ids"][form="' + bulk.getAttribute('id') + '"]')];
  const all = document.querySelector('[data-select-all]');
  const sync = () => {
    const n = boxes().filter(b => b.checked).length;
    bulk.querySelector('[data-bulk-submit]').disabled = n === 0;
    bulk.querySelector('[data-bulk-count]').textContent = n ? n + ' selected' : 'Select submissions to delete them';
    if (all) { all.checked = n > 0 && n === boxes().length; all.indeterminate = n > 0 && n < boxes().length; }
  };
  document.addEventListener('change', e => {
    if (e.target === all) boxes().forEach(b => { b.checked = all.checked; });
    if (e.target === all || e.target.name === 'ids') sync();
  });
  sync();
}`;

function document(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  <title>${escapeHtml(title)} · Horm</title>
  <link rel="preload" href="/dashboard/assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/dashboard/assets/app.css" />
  <link rel="icon" href="/dashboard/assets/icons/icon.svg" type="image/svg+xml" />
  <link rel="icon" href="/dashboard/assets/icons/icon-32.png" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/dashboard/assets/icons/apple-touch-icon.png" />
  <link rel="manifest" href="/dashboard/assets/icons/site.webmanifest" />
  <meta name="theme-color" content="#c23f24" />
</head>
<body>
${body}
<script>${script}</script>
</body>
</html>`;
}

/**
 * full dashboard page: ink rail with the form list + main work area
 * `body` must already be safe HTML
 */
export function layout(title: string, body: string, nav: { forms: NavForm[]; active?: string }) {
  const formLinks = nav.forms
    .map(
      ({ form, stats }) => `
      <a class="rail-link" href="/dashboard/forms/${encodeURIComponent(form.token)}"${
        nav.active === form.token ? ' aria-current="page"' : ''
      }>
        <span class="rail-dot${form.isActive ? '' : ' off'}" title="${form.isActive ? 'Accepting submissions' : 'Paused'}"></span>
        <span class="label">${escapeHtml(form.name)}</span>
        <span class="count num">${stats.total}</span>
      </a>`,
    )
    .join('');

  return document(
    title,
    `<div class="app">
  <nav class="rail" aria-label="Main">
    <a class="brand" href="/dashboard">${brandMark}<span>horm</span></a>
    <div class="rail-section">
      <a class="rail-link" href="/dashboard"${nav.active === 'forms' ? ' aria-current="page"' : ''}>
        ${icon('inbox')}<span class="label">All forms</span>
      </a>
      <a class="rail-link" href="/dashboard/settings"${nav.active === 'settings' ? ' aria-current="page"' : ''}>
        ${icon('sliders')}<span class="label">Settings</span>
      </a>
    </div>
    ${
      nav.forms.length
        ? `<div class="rail-section">
      <div class="rail-heading">Forms</div>
      ${formLinks}
    </div>`
        : ''
    }
    <div class="rail-foot">
      <form method="POST" action="/dashboard/logout">
        <button type="submit" class="rail-link">${icon('logout')}<span class="label">Log out</span></button>
      </form>
    </div>
  </nav>
  <main class="main"><div class="page">
${body}
  </div></main>
</div>`,
  );
}

/**
 * standalone page without the rail (login)
 */
export function bareLayout(title: string, body: string) {
  return document(title, body);
}
