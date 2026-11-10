import { ENUM_NOTIFY_TYPE } from '@/utils/enums.ts';

export interface RateLimitSettings {
  /** submissions allowed per IP per window; 0 = unlimited */
  max: number;
  /** window length in seconds */
  window: number;
}

export interface NotifySettings {
  channels: ENUM_NOTIFY_TYPE[];
  /** comma-separated email recipients */
  email: string;
  /** webhook URLs (http/https), each gets its own delivery + retries */
  webhooks: string[];
}

export const MAX_WEBHOOKS = 10;

/** accept settings saved before multiple webhooks existed ({ webhook: string }) */
export function normalizeNotify(value: any): NotifySettings | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const webhooks: string[] = Array.isArray(value.webhooks)
    ? value.webhooks.map(String)
    : typeof value.webhook === 'string' && value.webhook
      ? [value.webhook]
      : [];
  return {
    channels: Array.isArray(value.channels) ? value.channels : [],
    email: typeof value.email === 'string' ? value.email : '',
    webhooks,
  };
}

export interface GlobalSettings {
  /** public URL of this Horm install, e.g. https://forms.example.com ('' = detect from the request) */
  baseUrl: string;
  rateLimit: RateLimitSettings;
  notify: NotifySettings;
}

/** per-form overrides: a missing section means "use the global setting" */
export interface FormSettings {
  rateLimit?: RateLimitSettings;
  notify?: NotifySettings;
}

/** parse a JSON settings column, tolerating null / bad data */
export function parseFormSettings(value: string | null | undefined): FormSettings {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return {};
    if (parsed.notify) parsed.notify = normalizeNotify(parsed.notify);
    return parsed;
  } catch {
    return {};
  }
}
