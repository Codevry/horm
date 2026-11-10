import Globals from '@/utils/globals.ts';
import { ENUM_JOBS, ENUM_NOTIFY_TYPE } from '@/utils/enums.ts';
import type { Form } from '@/entity/entityForm.ts';

const CHANNELS = Object.values(ENUM_NOTIFY_TYPE) as string[];

/**
 * enabled notification channels from NOTIFY_CHANNELS (e.g. "email,webhook")
 */
export function notifyChannels(): ENUM_NOTIFY_TYPE[] {
  return (Bun.env.NOTIFY_CHANNELS ?? '')
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter((c): c is ENUM_NOTIFY_TYPE => CHANNELS.includes(c));
}

/**
 * queue one notification job per enabled channel (form settings, else global),
 * so a failing webhook never blocks the email and each channel retries on its own
 */
export async function enqueueRecordNotifications(record: unknown, form: Form) {
  const { channels, email, webhook } = Globals.ctrlSettings.effective(form).notify;
  if (!channels.length) return;
  if (!Globals.mqQueueRecord) {
    console.warn(`[Queue] notifications for "${form.name}" skipped: REDIS_URL is not set`);
    return;
  }

  for (const channel of channels) {
    const target = channel === ENUM_NOTIFY_TYPE.email ? email : webhook;
    await Globals.mqQueueRecord.addJob(ENUM_JOBS.sendRecordNotification, { channel, target, record, form });
  }
}
