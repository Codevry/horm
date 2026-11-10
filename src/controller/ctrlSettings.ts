import Globals from '@/utils/globals.ts';
import { ENUM_NOTIFY_TYPE } from '@/utils/enums.ts';
import type { FormSettings, GlobalSettings, NotifySettings, RateLimitSettings } from '@/entity/entitySettings.ts';
import type { Form } from '@/entity/entityForm.ts';

const CHANNELS = Object.values(ENUM_NOTIFY_TYPE) as string[];

export const LIMITS = { maxPerWindow: 10_000, windowSeconds: 86_400 } as const;

/**
 * defaults from environment variables (used until changed in the dashboard)
 */
export function envDefaults(): GlobalSettings {
  return {
    // Coolify exposes the generated domain as SERVICE_URL_APP / SERVICE_FQDN_APP
    baseUrl: envBaseUrl(Bun.env.BASE_URL || Bun.env.SERVICE_URL_APP || Bun.env.SERVICE_FQDN_APP || ''),
    rateLimit: {
      max: Math.max(0, Number(Bun.env.RATE_LIMIT_MAX ?? 10) || 0),
      window: Math.max(1, Number(Bun.env.RATE_LIMIT_WINDOW ?? 60) || 60),
    },
    notify: {
      channels: (Bun.env.NOTIFY_CHANNELS ?? '')
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter((c): c is ENUM_NOTIFY_TYPE => CHANNELS.includes(c)),
      email: Bun.env.NOTIFY_EMAIL ?? '',
      webhook: Bun.env.NOTIFY_WEBHOOK ?? '',
    },
  };
}

// ---------- validation (shared by dashboard + API) ----------

export class SettingsError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

/** trim and drop trailing slashes; '' stays '' */
export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/** env value may be a bare host (forms.example.com) or a URL; ignore anything unusable */
function envBaseUrl(value: string): string {
  const v = normalizeBaseUrl(value.split(',')[0] ?? '');
  if (!v) return '';
  try {
    return validateBaseUrl(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    console.warn(`[Settings] ignoring invalid BASE_URL: ${value}`);
    return '';
  }
}

export function validateBaseUrl(input: unknown): string {
  const value = normalizeBaseUrl(String(input ?? ''));
  if (!value) return '';
  let url: URL | null = null;
  try {
    url = new URL(value);
  } catch {}
  if (!url || !['http:', 'https:'].includes(url.protocol) || url.search || url.hash)
    throw new SettingsError('baseUrl', 'Enter a full URL like https://forms.example.com');
  return value;
}

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export function validateRateLimit(input: { max: unknown; window: unknown }): RateLimitSettings {
  const max = Number(input.max);
  const window = Number(input.window);
  if (!Number.isInteger(max) || max < 0 || max > LIMITS.maxPerWindow)
    throw new SettingsError('rateLimit.max', `Enter a whole number from 0 to ${LIMITS.maxPerWindow}.`);
  if (!Number.isInteger(window) || window < 1 || window > LIMITS.windowSeconds)
    throw new SettingsError('rateLimit.window', `Enter a number of seconds from 1 to ${LIMITS.windowSeconds}.`);
  return { max, window };
}

export function validateNotify(input: { channels: unknown; email: unknown; webhook: unknown }): NotifySettings {
  const channels = (Array.isArray(input.channels) ? input.channels : [input.channels])
    .map(c =>
      String(c ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter((c, i, all): c is ENUM_NOTIFY_TYPE => CHANNELS.includes(c) && all.indexOf(c) === i);

  const email = String(input.email ?? '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
  const webhook = String(input.webhook ?? '').trim();

  if (email.some(e => !EMAIL.test(e)))
    throw new SettingsError('notify.email', 'Enter valid email addresses, separated by commas.');
  if (webhook) {
    let url: URL | null = null;
    try {
      url = new URL(webhook);
    } catch {}
    if (!url || !['http:', 'https:'].includes(url.protocol))
      throw new SettingsError('notify.webhook', 'Enter a full http:// or https:// URL.');
  }
  if (channels.includes(ENUM_NOTIFY_TYPE.email) && email.length === 0)
    throw new SettingsError('notify.email', 'Add at least one recipient, or turn email off.');
  if (channels.includes(ENUM_NOTIFY_TYPE.webhook) && !webhook)
    throw new SettingsError('notify.webhook', 'Add a webhook URL, or turn the webhook off.');

  return { channels, email: email.join(', '), webhook };
}

// ---------- storage ----------

export default class CtrlSettings {
  private cache: GlobalSettings | null = null;

  /**
   * global settings: values saved in the dashboard, falling back to env defaults
   */
  getGlobal(): GlobalSettings {
    if (this.cache) return this.cache;
    const defaults = envDefaults();
    const rows = Globals.db.query<{ key: string; value: string }, []>('SELECT key, value FROM settings').all();
    const saved: Partial<GlobalSettings> = {};
    for (const row of rows) {
      try {
        (saved as Record<string, unknown>)[row.key] = JSON.parse(row.value);
      } catch {}
    }
    this.cache = {
      baseUrl: typeof saved.baseUrl === 'string' ? saved.baseUrl : defaults.baseUrl,
      rateLimit: saved.rateLimit ?? defaults.rateLimit,
      notify: saved.notify ?? defaults.notify,
    };
    return this.cache;
  }

  /** which global sections were changed in the dashboard (vs coming from env) */
  savedGlobalKeys(): Set<string> {
    return new Set(
      Globals.db
        .query<{ key: string }, []>('SELECT key FROM settings')
        .all()
        .map(r => r.key),
    );
  }

  setGlobal(key: keyof GlobalSettings, value: string | RateLimitSettings | NotifySettings) {
    Globals.db
      .query('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value')
      .run(key, JSON.stringify(value));
    this.cache = null;
  }

  /** forget a dashboard value so the env default applies again */
  resetGlobal(key: keyof GlobalSettings) {
    Globals.db.query('DELETE FROM settings WHERE key = ?').run(key);
    this.cache = null;
  }

  setForm(token: string, settings: FormSettings) {
    const value = Object.keys(settings).length ? JSON.stringify(settings) : null;
    Globals.db.query('UPDATE forms SET settings = ? WHERE token = ?').run(value, token);
  }

  /**
   * settings that actually apply to a form: its overrides, else global
   */
  effective(form: Pick<Form, 'settings'> | null): GlobalSettings {
    const global = this.getGlobal();
    return {
      baseUrl: global.baseUrl,
      rateLimit: form?.settings.rateLimit ?? global.rateLimit,
      notify: form?.settings.notify ?? global.notify,
    };
  }
}
