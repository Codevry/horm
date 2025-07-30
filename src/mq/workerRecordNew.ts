import { type ConnectionOptions, Job, Worker } from 'bullmq';
import { ENUM_JOBS, ENUM_NOTIFY_TYPE, type ENUM_QUEUE } from '@/utils/enums.ts';
import nodemailer from 'nodemailer';
import emailNewRecord from '@/mail/emailNewRecord.tsx';

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
    port: Bun.env.SMTP_PORT,
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
export default function (queue: ENUM_QUEUE, connection: ConnectionOptions) {
  new Worker(
    queue,
    async (job: Job) => {
      const result: string[] = [];

      // get notification channels
      const notifyChannels = Bun.env.NOTIFY_CHANNELS?.split(',') || [];

      // if the job name is sending record notification
      if (job.name === ENUM_JOBS.sendRecordNotification) {
        // webhook
        if (notifyChannels.includes(ENUM_NOTIFY_TYPE.webhook)) {
          const { record, form } = job.data;
          await sendWebhook(Bun.env.NOTIFY_WEBHOOK, {
            jobId: job.id,
            jobName: job.name,
            record,
            form,
          });
          result.push('webhook');
        }

        // email
        if (notifyChannels.includes(ENUM_NOTIFY_TYPE.email)) {
          const { record, form } = job.data;
          await sendEmail(Bun.env.NOTIFY_EMAIL, `New record created in form: ${form.name}`, {
            jobId: job.id,
            jobName: job.name,
            record,
            form,
          });
          result.push('email');
        }
      }

      return `Notification sent via ${result.join(',')}`;
    },
    { connection },
  );
}
