# Environment Variables

The following environment variables are required for the application:

| Variable          | Type   | Description                                            |
|-------------------|--------|--------------------------------------------------------|
| POSTGRES_USER     | string | Default postgres user name                             |
| POSTGRES_PASSWORD | string | Default postgres user password                         |
| POSTGRES_DB       | string | Name of postgres db                                    |
| POSTGRES_PORT     | string | Exposed postgres port on local machine                 |
| REDIS_PORT        | string | Exposed redis port on local machine                    |
| SMTP_HOST         | string | SMTP server hostname for email delivery                |
| SMTP_PORT         | number | SMTP server port number                                |
| SMTP_USER         | string | SMTP authentication username                           |
| SMTP_PASS         | string | SMTP authentication password                           |
| SMTP_FROM         | string | Default sender email address                           |
| SMTP_SECURE       | string | Enable/disable secure SMTP connection ('true'/'false') |
| NOTIFY_EMAIL      | string | Email address for notifications                        |
| NOTIFY_WEBHOOK    | string | Webhook URL for notifications                          |
| NOTIFY_CHANNELS   | string | Comma-separated list of notification channels          |

## Setup Instructions

1. Create a new `.env` file in the root directory
2. Copy the variables above and set their values according to your environment
3. The `.env` file should not be committed to version control

### Example

See [`.env.docker.example`](.env.docker.example) file for reference
