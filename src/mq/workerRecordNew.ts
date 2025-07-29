import { Job, Worker } from 'bullmq';
import { ENUM_JOBS, type ENUM_QUEUE } from '@/utils/enums.ts';
import nodemailer from 'nodemailer';

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

    return await response.json();
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
async function sendEmail(to: string, subject: string, body: string) {
  const transporter = nodemailer.createTransport({
    host: Bun.env.SMTP_HOST,
    port: Bun.env.SMTP_PORT,
    secure: Bun.env.SMTP_SECURE,
    auth: {
      user: Bun.env.SMTP_USER,
      pass: Bun.env.SMTP_PASS,
    },
  });

  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: body,
    });
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * default function
 * @param queue
 */
export default function (queue: ENUM_QUEUE) {
  new Worker(queue, async (job: Job) => {
    const { webhookUrl, data, form } = job.data;

    if (job.name === ENUM_JOBS.sendWebhook) {
      return await sendWebhook(webhookUrl, data);
    }

    if (job.name === ENUM_JOBS.sendEmail) {
      return await sendEmail(Bun.env.RECORD_EMAIL_TO, `New record created in form: ${form.name}`, data);
    }

    throw new Error('Either webhook URL or email details are required');
  });
}
