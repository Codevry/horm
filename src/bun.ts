declare module 'bun' {
  interface Env {
    PORT: number;
    CORS: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
    SMTP_SECURE: boolean;
    RECORD_EMAIL_TO: string;
  }
}
