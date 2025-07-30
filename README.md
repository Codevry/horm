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

### Pre-Requisites

* Redis database (used for keeping track of sending/retrying notification)
* Bun runtime installed (https://bun.com/)
* Setup .env file as mentioned in [the ENV.md](ENV.md) file

### Getting Started
* Install dependencies by `bun install --frozen-lockfile --production`
* Start the server `bun start`
* On starting the server, default admin details will be printed on the console
* Use the `token` for all API operations

### APIs

* OpenAPI file provided in [openapi.yaml](openapi.yaml)
* You can copy/paste it on [Swagger Editor](https://editor.swagger.io/) for the GUI view

