# Environment Variables (Docker Compose / Coolify)

All variables are optional. The SQLite database is stored on the `horm-data` volume at `/app/data/horm.sqlite`.

| Variable               | Type   | Description                                                        |
|------------------------|--------|--------------------------------------------------------------------|
| PORT                   | number | Host port to publish the app on for local runs (default `9988`)    |
| SERVICE_PASSWORD_REDIS | string | Redis password inside the stack (Coolify generates it; default `horm`) |
| BASE_URL               | string | Public URL used in form snippets. Defaults to Coolify's generated domain; can be changed in Dashboard > Settings |
| CORS                   | string | Comma-separated allowed origins for form submissions (default `*`) |
| RATE_LIMIT_MAX         | number | Form submissions allowed per IP per window (default `10`, `0` disables) |
| RATE_LIMIT_WINDOW      | number | Rate-limit window in seconds (default `60`)                        |
| TRUST_PROXY            | string | `true` behind a reverse proxy: read the visitor IP from `X-Forwarded-For` (compose default `true`, `false` for local runs) |
| MAX_SUBMISSION_KB      | number | Largest accepted submission body in KB (default `100`)             |
| NOTIFY_ATTEMPTS        | number | Tries per notification before giving up (default `5`)              |
| NOTIFY_RETRY_DELAY     | number | Seconds before the first retry; doubles each time (default `30`)   |
| SMTP_HOST              | string | SMTP server hostname for email delivery                            |
| SMTP_PORT              | number | SMTP server port number                                            |
| SMTP_USER              | string | SMTP authentication username                                       |
| SMTP_PASS              | string | SMTP authentication password                                       |
| SMTP_FROM              | string | Default sender email address                                       |
| SMTP_SECURE            | string | Enable/disable secure SMTP connection ('true'/'false')             |
| NOTIFY_EMAIL           | string | Email address for notifications                                    |
| NOTIFY_WEBHOOK         | string | Webhook URL for notifications                                      |
| NOTIFY_CHANNELS        | string | Comma-separated list of notification channels (`email,webhook`)    |

## Setup Instructions

1. Copy [`.env.docker.example`](.env.docker.example) to `.env` and adjust the values
2. The `.env` file should not be committed to version control
