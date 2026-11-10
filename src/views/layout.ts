import { escapeHtml } from '@/utils/html.ts';

/**
 * wrap a page body in the dashboard layout
 * `title` is escaped, `body` must already be safe HTML
 */
export function layout(title: string, body: string, options: { loggedIn?: boolean } = {}) {
  const safeTitle = escapeHtml(title);
  const nav = options.loggedIn
    ? `<nav class="nav">
        <a href="/dashboard">Forms</a>
        <form method="POST" action="/dashboard/logout"><button type="submit">Log out</button></form>
      </nav>`
    : '';

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 40px auto;
        padding: 0 20px;
        background-color: #f9f9f9;
        color: #333;
      }

      h1 {
        text-align: center;
        margin-bottom: 30px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background-color: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        overflow: hidden;
      }

      th, td {
        padding: 12px 16px;
        text-align: left;
      }

      th {
        background-color: #f1f1f1;
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: #fafafa;
      }

      tr:hover {
        background-color: #f0f8ff;
      }

      a {
        text-decoration: none;
        color: #0077cc;
      }

      a:hover {
        text-decoration: underline;
      }

      button {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        background-color: #0077cc;
        color: white;
        cursor: pointer;
        font-size: 14px;
      }

      button:hover {
        background-color: #005fa3;
      }

      .top-link {
        display: inline-block;
        margin-bottom: 20px;
        padding: 8px 14px;
        background-color: #28a745;
        color: white;
        border-radius: 6px;
        font-weight: bold;
      }

      .top-link:hover {
        background-color: #218838;
      }

      form {
        display: inline;
      }

      input[type="text"], input[name="name"] {
        padding: 8px;
        width: 60%;
        max-width: 300px;
        border: 1px solid #ccc;
        border-radius: 6px;
        margin-right: 10px;
        font-size: 14px;
      }

      form button {
        margin-top: 10px;
      }

      .nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .error {
        color: #b00020;
      }

      .muted {
        color: #777;
      }
    </style>
  </head>
  <body>
    ${nav}
    <h1>${safeTitle}</h1>
    ${body}
  </body>
  </html>`;
}
