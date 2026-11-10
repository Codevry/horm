# Environment Variables

The following environment variables are required for the application:

| Variable        | Type   | Description                                            |
|-----------------|--------|--------------------------------------------------------|
| PORT            | number | The port number on which the server will listen        |
| BASE_URL        | string | Public URL of this install, used in form snippets (also settable in Dashboard > Settings) |
| CORS            | string | CORS configuration for allowed origins                 |
| REDIS_URL       | string | Redis connection URL. Optional: needed for email/webhook notifications; also shares rate-limit counters between instances |
| SQLITE_PATH     | string | Path of the SQLite database file (default `data/horm.sqlite`, created if missing) |
| RATE_LIMIT_MAX  | number | Form submissions allowed per IP per window (default `10`, `0` disables) |
| RATE_LIMIT_WINDOW | number | Rate-limit window in seconds (default `60`)                         |
| TRUST_PROXY     | string | `true` when behind a reverse proxy, to read the visitor IP from `X-Forwarded-For` |
| MAX_SUBMISSION_KB | number | Largest accepted submission body in KB (default `100`)              |
| NOTIFY_ATTEMPTS | number | Tries per notification before giving up (default `5`)                  |
| NOTIFY_RETRY_DELAY | number | Seconds before the first retry; doubles each time (default `30`)    |
| SMTP_HOST       | string | SMTP server hostname for email delivery                |
| SMTP_PORT       | number | SMTP server port number                                |
| SMTP_USER       | string | SMTP authentication username                           |
| SMTP_PASS       | string | SMTP authentication password                           |
| SMTP_FROM       | string | Default sender email address                           |
| SMTP_SECURE     | string | Enable/disable secure SMTP connection ('true'/'false') |
| NOTIFY_EMAIL    | string | Email address for notifications                        |
| NOTIFY_WEBHOOK  | string | Webhook URL for notifications                          |
| NOTIFY_CHANNELS | string | Comma-separated list of notification channels          |

## Setup Instructions

1. Create a new `.env` file in the root directory
2. Copy the variables above and set their values according to your environment
3. The `.env` file should not be committed to version control

### Example

See [`.env.source.example`](.env.source.example) file for reference
