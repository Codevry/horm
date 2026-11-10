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
 * one job per destination, so a failing webhook never blocks the others and each retries on its own
 */
export async function enqueueRecordNotifications(record: unknown, form: Form) {
  const { channels, email, webhooks } = Globals.ctrlSettings.effective(form).notify;
  if (!channels.length) return;
  if (!Globals.mqQueueRecord) {
    console.warn(`[Queue] notifications for "${form.name}" skipped: REDIS_URL is not set`);
    return;
  }

  // one job per email batch and per webhook URL: each delivers and retries independently
  const jobs: { channel: ENUM_NOTIFY_TYPE; target: string }[] = [];
  if (channels.includes(ENUM_NOTIFY_TYPE.email) && email) jobs.push({ channel: ENUM_NOTIFY_TYPE.email, target: email });
  if (channels.includes(ENUM_NOTIFY_TYPE.webhook))
    for (const url of webhooks) jobs.push({ channel: ENUM_NOTIFY_TYPE.webhook, target: url });

  // receivers get the form's public details, not its settings (other webhook URLs / recipients)
  const { settings: _settings, ...publicForm } = form;
  for (const job of jobs)
    await Globals.mqQueueRecord.addJob(ENUM_JOBS.sendRecordNotification, { ...job, record, form: publicForm });
}
