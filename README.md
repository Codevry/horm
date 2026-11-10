# HORM
> Html form backend

Horm is basically a backend to help you manage multiple forms and their responses. 
It is super easy to set up/use and will help you save your HTML form responses on your own server.

### Features

* Host on your own server
* REST APIs for interaction
* Admin user for all sensitive operations
* Create unlimited forms and entries
* Setup CORS your way (or keep it wildcard)
* Notification triggers on new record submission
  * Email
  * Webhook

### Installation

#### Coolify
* In Coolify, create a new resource from this Git repository and pick the **Docker Compose** build pack
  (the default compose location `/docker-compose.yaml` is correct)
* Coolify generates a domain for the app (`SERVICE_FQDN_APP_9988`) and a Redis password automatically
* Optionally set `CORS`, `SMTP_*` and `NOTIFY_*` in the *Environment Variables* tab ([ENV.docker.md](ENV.docker.md))
* Deploy; the admin token is printed in the logs of the `app` container on first start
* Data is kept in the `horm-data` volume (SQLite file at `/app/data/horm.sqlite`)

#### Docker Compose
* Clone the project
* Optionally setup a .env file as mentioned in the [ENV.docker.md](ENV.docker.md) file
* Start the service using `docker compose up`
* Default credentials (admin token) will be printed in logs inside the app container

#### Docker (single container)
* Build: `docker build -t horm .`
* Run with your own Redis: `docker run -p 9988:9988 -v horm-data:/app/data -e REDIS_URL=redis://host:6379 horm`

#### Building From Source

##### Pre-Requisites

* Clone the project
* Redis database (used for keeping track of sending/retrying notification)
* Bun runtime installed (https://bun.com/)
* Setup .env file as mentioned in [the ENV.md](ENV.md) file

##### Getting Started
* Install dependencies by `bun install --frozen-lockfile --production`
* Start the server `bun start`
* On starting the server, default admin details will be printed on the console
* Use the `token` for all API operations

### Dashboard

* Open `/dashboard` in a browser and log in with the admin token
* Create forms, enable/disable them, view records and download them as CSV or JSON

### APIs

* OpenAPI file provided in [openapi.yaml](openapi.yaml)
* You can copy/paste it on [Swagger Editor](https://editor.swagger.io/) for the GUI view

