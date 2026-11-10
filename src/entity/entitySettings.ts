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
  /** webhook URL (http/https) */
  webhook: string;
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
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
