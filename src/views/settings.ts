import { escapeHtml } from '@/utils/html.ts';
import { icon } from '@/views/icons.ts';
import { ENUM_NOTIFY_TYPE } from '@/utils/enums.ts';
import type { Form } from '@/entity/entityForm.ts';
import {
  MAX_WEBHOOKS,
  type GlobalSettings,
  type NotifySettings,
  type RateLimitSettings,
} from '@/entity/entitySettings.ts';

export type FieldErrors = Record<string, string>;

export interface SystemStatus {
  redis: boolean;
  smtp: boolean;
  cors: string;
  trustProxy: boolean;
  detectedUrl: string;
}

// ---------- small building blocks ----------

const err = (errors: FieldErrors, field: string) =>
  errors[field] ? `<p class="error" id="${field}-error">${icon('alert')}${escapeHtml(errors[field])}</p>` : '';

const invalid = (errors: FieldErrors, field: string) =>
  errors[field] ? ` aria-invalid="true" aria-describedby="${field}-error"` : '';

export const describeRate = (r: RateLimitSettings) =>
  r.max > 0
    ? `${r.max} per ${r.window === 60 ? 'minute' : r.window === 3600 ? 'hour' : `${r.window} s`} per visitor`
    : 'Unlimited';

export const describeNotify = (n: NotifySettings) => {
  if (!n.channels.length) return 'Off';
  return n.channels
    .map(c =>
      c === ENUM_NOTIFY_TYPE.email
        ? `email to ${n.email}`
        : n.webhooks.length === 1
          ? `webhook to ${n.webhooks[0]}`
          : `${n.webhooks.length} webhooks`,
    )
    .join(' · ');
};

function flash(saved?: boolean) {
  return saved ? `<p class="flash" role="status">${icon('check')}Settings saved</p>` : '';
}

function rateFields(r: RateLimitSettings, errors: FieldErrors, prefix = '') {
  return `<div class="inline-fields">
    <div class="field">
      <label for="${prefix}rl-max">Submissions</label>
      <input class="input num" id="${prefix}rl-max" name="rateLimit.max" type="number" min="0" max="10000" step="1"
        value="${r.max}"${invalid(errors, 'rateLimit.max')} />
    </div>
    <span class="per">per</span>
    <div class="field">
      <label for="${prefix}rl-window">Seconds</label>
      <input class="input num" id="${prefix}rl-window" name="rateLimit.window" type="number" min="1" max="86400" step="1"
        value="${r.window}"${invalid(errors, 'rateLimit.window')} />
    </div>
  </div>
  ${err(errors, 'rateLimit.max')}${err(errors, 'rateLimit.window')}
  <p class="hint">Counted per visitor IP, per form. Use 0 for no limit.</p>`;
}

function notifyFields(n: NotifySettings, errors: FieldErrors, smtp: boolean, redis: boolean, prefix = '') {
  const on = (c: ENUM_NOTIFY_TYPE) => (n.channels.includes(c) ? ' checked' : '');
  return `<div class="channel">
      <label class="check"><input type="checkbox" name="notify.channels" value="email"${on(ENUM_NOTIFY_TYPE.email)} /> Email</label>
      <div class="field">
        <label for="${prefix}n-email" class="sr-only">Email recipients</label>
        <input class="input" id="${prefix}n-email" name="notify.email" type="text" inputmode="email"
          placeholder="you@example.com, team@example.com" value="${escapeHtml(n.email)}"${invalid(errors, 'notify.email')} />
        ${err(errors, 'notify.email')}
        ${smtp ? '' : '<p class="hint warn">SMTP isn\'t configured on the server (SMTP_HOST), so emails can\'t be sent yet.</p>'}
      </div>
    </div>
    <div class="channel">
      <label class="check"><input type="checkbox" name="notify.channels" value="webhook"${on(ENUM_NOTIFY_TYPE.webhook)} /> Webhook</label>
      <div class="field">
        <label for="${prefix}n-webhooks" class="sr-only">Webhook URLs, one per line</label>
        <textarea class="input mono textarea" id="${prefix}n-webhooks" name="notify.webhooks" rows="${Math.min(MAX_WEBHOOKS, Math.max(2, n.webhooks.length + 1))}"
          spellcheck="false" placeholder="https://hooks.example.com/horm&#10;https://api.example.com/new-lead"${invalid(errors, 'notify.webhooks')}>${escapeHtml(n.webhooks.join('\n'))}</textarea>
        ${err(errors, 'notify.webhooks')}
        <p class="hint">One URL per line, up to ${MAX_WEBHOOKS}. Each gets a JSON POST for every submission and is retried on its own if it fails.</p>
      </div>
    </div>
    ${redis ? '' : '<p class="hint warn">Redis isn\'t configured (REDIS_URL), so no notifications are sent.</p>'}`;
}

// ---------- global settings ----------

export function globalSettingsView(
  s: GlobalSettings,
  status: SystemStatus,
  opts: { errors?: FieldErrors; saved?: boolean } = {},
) {
  const errors = opts.errors ?? {};
  const effectiveUrl = s.baseUrl || status.detectedUrl;
  const row = (label: string, ok: boolean, detail: string) =>
    `<li><span class="status ${ok ? 'on' : 'off'}">${ok ? 'OK' : 'Off'}</span><span><strong>${label}</strong> <span class="muted">${detail}</span></span></li>`;

  return `
  <header class="page-head">
    <div>
      <h1>Settings</h1>
      <p class="page-meta">Defaults for every form. Each form can override rate limits and notifications.</p>
    </div>
  </header>
  ${flash(opts.saved)}
  <form method="POST" action="/dashboard/settings" class="settings">
    <section class="panel setting">
      <div class="setting-head">
        <h2>Base URL</h2>
        <p class="hint">The public address of this Horm install. Used in every form's integration snippet.</p>
      </div>
      <div class="setting-body">
        <div class="field">
          <label for="base-url">Base URL</label>
          <input class="input mono" id="base-url" name="baseUrl" type="url" placeholder="${escapeHtml(status.detectedUrl)}"
            value="${escapeHtml(s.baseUrl)}"${invalid(errors, 'baseUrl')} />
          ${err(errors, 'baseUrl')}
          <p class="hint">Leave empty to use the address the dashboard is opened from. Forms post to
            <code>${escapeHtml(effectiveUrl)}/records</code></p>
        </div>
      </div>
    </section>

    <section class="panel setting">
      <div class="setting-head">
        <h2>Rate limit</h2>
        <p class="hint">Stops one visitor from flooding a form with submissions.</p>
      </div>
      <div class="setting-body">${rateFields(s.rateLimit, errors)}</div>
    </section>

    <section class="panel setting">
      <div class="setting-head">
        <h2>Notifications</h2>
        <p class="hint">Get told about every new submission.</p>
      </div>
      <div class="setting-body stack">${notifyFields(s.notify, errors, status.smtp, status.redis)}</div>
    </section>

    <div class="form-actions sticky-actions">
      <button type="submit" class="btn btn-primary">Save settings</button>
    </div>
  </form>

  <section class="panel setting">
    <div class="setting-head">
      <h2>Server</h2>
      <p class="hint">Set with environment variables. See ENV.md.</p>
    </div>
    <ul class="setting-body status-list">
      ${row('Redis', status.redis, status.redis ? 'connected; notifications are queued and retried' : 'REDIS_URL not set; notifications are off')}
      ${row('SMTP', status.smtp, status.smtp ? 'SMTP_HOST is set' : 'SMTP_HOST not set; email notifications cannot be sent')}
      ${row('CORS', true, `allowed sites: <code>${escapeHtml(status.cors)}</code>`)}
      ${row('Proxy', status.trustProxy, status.trustProxy ? 'visitor IP read from X-Forwarded-For' : 'visitor IP read from the connection (TRUST_PROXY=false)')}
    </ul>
  </section>`;
}

// ---------- per-form settings ----------

function modeRadio(name: string, value: string, checked: boolean, label: string, detail: string) {
  return `<label class="choice">
    <input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''} />
    <span><strong>${label}</strong><span class="muted">${detail}</span></span>
  </label>`;
}

export function formSettingsView(
  form: Form,
  global: GlobalSettings,
  status: SystemStatus,
  opts: {
    errors?: FieldErrors;
    saved?: boolean;
    draft?: { rateLimit?: RateLimitSettings; notify?: NotifySettings; rateMode?: string; notifyMode?: string };
  } = {},
) {
  const errors = opts.errors ?? {};
  const token = encodeURIComponent(form.token);
  const rateMode = opts.draft?.rateMode ?? (form.settings.rateLimit ? 'custom' : 'global');
  const notifyMode = opts.draft?.notifyMode ?? (form.settings.notify ? 'custom' : 'global');
  const rate = opts.draft?.rateLimit ?? form.settings.rateLimit ?? global.rateLimit;
  const notify = opts.draft?.notify ?? form.settings.notify ?? global.notify;

  return `
  <a class="back" href="/dashboard/forms/${token}">${icon('arrowLeft')}${escapeHtml(form.name)}</a>
  <header class="page-head">
    <div>
      <h1>Form settings</h1>
      <p class="page-meta">${escapeHtml(form.name)} · <a href="/dashboard/settings">Global defaults</a></p>
    </div>
  </header>
  ${flash(opts.saved)}
  <form method="POST" action="/dashboard/forms/${token}/settings" class="settings">
    <section class="panel setting">
      <div class="setting-head">
        <h2>Rate limit</h2>
        <p class="hint">Submissions allowed per visitor for this form.</p>
      </div>
      <div class="setting-body stack" data-mode-group>
        ${modeRadio('rateMode', 'global', rateMode === 'global', 'Use global setting', describeRate(global.rateLimit))}
        ${modeRadio('rateMode', 'custom', rateMode === 'custom', 'Custom for this form', 'Set a different limit below')}
        <fieldset class="custom" data-when="custom"${rateMode === 'custom' ? '' : ' disabled'}>
          <legend class="sr-only">Custom rate limit</legend>
          ${rateFields(rate, errors, 'f-')}
        </fieldset>
      </div>
    </section>

    <section class="panel setting">
      <div class="setting-head">
        <h2>Notifications</h2>
        <p class="hint">Who hears about new submissions to this form.</p>
      </div>
      <div class="setting-body stack" data-mode-group>
        ${modeRadio('notifyMode', 'global', notifyMode === 'global', 'Use global setting', escapeHtml(describeNotify(global.notify)))}
        ${modeRadio('notifyMode', 'custom', notifyMode === 'custom', 'Custom for this form', 'Untick both channels to turn notifications off for this form')}
        <fieldset class="custom stack" data-when="custom"${notifyMode === 'custom' ? '' : ' disabled'}>
          <legend class="sr-only">Custom notifications</legend>
          ${notifyFields(notify, errors, status.smtp, status.redis, 'f-')}
        </fieldset>
      </div>
    </section>

    <div class="form-actions">
      <a href="/dashboard/forms/${token}" class="btn">Cancel</a>
      <button type="submit" class="btn btn-primary">Save settings</button>
    </div>
  </form>

  <section class="panel setting danger">
    <div class="setting-head">
      <h2>Delete form</h2>
      <p class="hint">Deletes the form and all of its submissions. This can't be undone.</p>
    </div>
    <form method="POST" action="/dashboard/forms/${token}/delete" class="setting-body stack">
      <label class="check"><input type="checkbox" name="confirm" value="yes" required />
        I understand all submissions to “${escapeHtml(form.name)}” will be deleted</label>
      ${err(errors, 'confirm')}
      <div><button type="submit" class="btn btn-danger">${icon('trash')}Delete form</button></div>
    </form>
  </section>

  <script>
    // enable the custom fields only while "Custom" is selected
    document.querySelectorAll('[data-mode-group]').forEach(group => {
      const sync = () => {
        const custom = group.querySelector('input[type=radio][value=custom]').checked;
        group.querySelector('[data-when=custom]').disabled = !custom;
      };
      group.addEventListener('change', sync);
    });
  </script>`;
}
