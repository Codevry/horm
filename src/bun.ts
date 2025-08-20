declare module 'bun' {
  interface Env {
    PORT: number;
    CORS: string;
    POSTGRES_URL: string;
    REDIS_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
    SMTP_SECURE: string;
    NOTIFY_EMAIL: string;
    NOTIFY_WEBHOOK: string;
    NOTIFY_CHANNELS: string;
  }
}
