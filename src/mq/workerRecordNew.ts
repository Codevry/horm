import { type ConnectionOptions, Job, UnrecoverableError, Worker } from 'bullmq';
import { ENUM_JOBS, ENUM_NOTIFY_TYPE, type ENUM_QUEUE } from '@/utils/enums.ts';
import nodemailer from 'nodemailer';
import emailNewRecord from '@/mail/emailNewRecord.tsx';
import { notifyChannels } from '@/mq/notify.ts';

/**
 * send webhook
 * @param url
 * @param data
 */
async function sendWebhook(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to send webhook: ${error.message}`);
  }
}

/**
 * send email
 * @param to
 * @param subject
 * @param body
 */
async function sendEmail(to: string, subject: string, body: object) {
  const transporterOptions: any = {
    host: Bun.env.SMTP_HOST,
    port: Number(Bun.env.SMTP_PORT) || 587,
    secure: Bun.env.SMTP_SECURE !== 'false',
  };

  // if user present then set auth
  if (Bun.env.SMTP_USER)
    transporterOptions.auth = {
      user: Bun.env.SMTP_USER,
      pass: Bun.env.SMTP_PASS,
    };

  // create transporter
  const transporter = nodemailer.createTransport(transporterOptions);

  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: await emailNewRecord(body),
    });
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * default function
 * @param queue
 * @param connection
 */
/**
 * send one notification for a new record; config errors are not retried
 */
async function notify(channel: ENUM_NOTIFY_TYPE, job: Job) {
  const { record, form } = job.data;
  const payload = { jobId: job.id, jobName: job.name, record, form };

  if (channel === ENUM_NOTIFY_TYPE.webhook) {
    if (!Bun.env.NOTIFY_WEBHOOK) throw new UnrecoverableError('NOTIFY_WEBHOOK is not set');
    await sendWebhook(Bun.env.NOTIFY_WEBHOOK, payload);
  } else if (channel === ENUM_NOTIFY_TYPE.email) {
    if (!Bun.env.NOTIFY_EMAIL || !Bun.env.SMTP_HOST)
      throw new UnrecoverableError('NOTIFY_EMAIL and SMTP_HOST must be set to send emails');
    await sendEmail(Bun.env.NOTIFY_EMAIL, `New record created in form: ${form.name}`, payload);
  } else {
    throw new UnrecoverableError(`Unknown notification channel: ${channel}`);
  }
}

/**
 * default function
 * @param queue
 * @param connection
 */
export default function (queue: ENUM_QUEUE, connection: ConnectionOptions) {
  new Worker(
    queue,
    async (job: Job) => {
      if (job.name !== ENUM_JOBS.sendRecordNotification) return 'Ignored';

      // jobs queued by older versions carry no channel: send to every enabled channel
      const channels: ENUM_NOTIFY_TYPE[] = job.data.channel ? [job.data.channel] : notifyChannels();
      for (const channel of channels) await notify(channel, job);

      return `Notification sent via ${channels.join(',')}`;
    },
    { connection },
  );
}
