import Globals from '@/utils/globals.ts';
import { ENUM_JOBS, ENUM_NOTIFY_TYPE } from '@/utils/enums.ts';

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
 * queue one notification job per enabled channel, so a failing webhook
 * never blocks the email (and each channel retries on its own)
 */
export async function enqueueRecordNotifications(record: unknown, form: unknown) {
  const channels = notifyChannels();
  if (!channels.length || !Globals.mqQueueRecord) return;

  for (const channel of channels) {
    await Globals.mqQueueRecord.addJob(ENUM_JOBS.sendRecordNotification, { channel, record, form });
  }
}
