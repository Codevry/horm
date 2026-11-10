import { Hono, type Context } from 'hono';
import { csrf } from 'hono/csrf';
import { deleteCookie, setCookie } from 'hono/cookie';
import { bareLayout, layout, type NavForm } from '@/views/layout.ts';
import { formsView, newFormView } from '@/views/forms.ts';
import { loginView } from '@/views/login.ts';
import { formRecordsView } from '@/views/record.ts';
import { icon } from '@/views/icons.ts';
import Globals from '@/utils/globals.ts';
import { findAdminByToken } from '@/utils/auth.ts';
import { escapeHtml } from '@/utils/html.ts';
import { recordsToCsv, safeFileName } from '@/utils/export.ts';
import middlewareAuthDashboard, { DASHBOARD_COOKIE } from '@/middlewares/middlewareAuthDashboard.ts';
import type { Records } from '@/entity/entityRecords.ts';

const app = new Hono();

// reject cross-origin form posts (cookie is SameSite=Strict as well)
app.use(csrf());

const cookieOptions = (c: Context) => ({
  path: '/dashboard',
  httpOnly: true,
  sameSite: 'Strict' as const,
  // behind a reverse proxy (e.g. Coolify / Traefik) the original scheme is in x-forwarded-proto
  secure: c.req.header('x-forwarded-proto') === 'https' || new URL(c.req.url).protocol === 'https:',
  maxAge: 60 * 60 * 24 * 7,
});

type Status = 200 | 400 | 404 | 500;

// forms + submission stats, used by the side rail on every page and by the forms list
const navData = async () => {
  const result = await Globals.ctrlForm.get();
  const { stats, start, days, empty } = Globals.ctrlRecords.stats();
  const forms: NavForm[] = (result.data ?? []).map(form => ({ form, stats: stats.get(form.token) ?? empty() }));
  return { forms, start, days };
};

const page = async (c: Context, title: string, body: string, active?: string, status: Status = 200) => {
  const { forms } = await navData();
  return c.html(layout(title, body, { forms, active }), status);
};

const errorPage = (c: Context, title: string, message: string, status: Status = 400) =>
  page(
    c,
    title,
    `<a class="back" href="/dashboard">${icon('arrowLeft')}All forms</a>
    <section class="panel empty"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></section>`,
    undefined,
    status,
  );

// public base URL as the browser sees it (handles reverse proxies like Coolify / Traefik)
const publicOrigin = (c: Context) => {
  const url = new URL(c.req.url);
  const proto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim() || url.protocol.replace(':', '');
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || url.host;
  return `${proto}://${host}`;
};

// --- public: static assets (css, fonts)

const ASSETS: Record<string, string> = {
  'app.css': 'text/css; charset=utf-8',
  'fonts/instrument-sans.woff2': 'font/woff2',
  'fonts/jetbrains-mono.woff2': 'font/woff2',
};

app.get('/assets/*', c => {
  const path = c.req.path.replace(/^\/dashboard\/assets\//, '');
  const type = ASSETS[path];
  if (!type) return c.notFound();

  const file = Bun.file(new URL(`../views/assets/${path}`, import.meta.url));
  return c.body(file.stream(), 200, {
    'Content-Type': type,
    'Cache-Control': path.startsWith('fonts/') ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
  });
});

// --- public: login / logout

app.get('/login', c => c.html(bareLayout('Sign in', loginView())));

app.post('/login', async c => {
  const body = await c.req.parseBody();
  const token = typeof body.token === 'string' ? body.token : '';
  const user = await findAdminByToken(token);
  if (!user)
    return c.html(
      bareLayout('Sign in', loginView("That token doesn't match an admin. Check the server logs and try again.")),
      401,
    );

  setCookie(c, DASHBOARD_COOKIE, user.token, cookieOptions(c));
  return c.redirect('/dashboard');
});

app.post('/logout', c => {
  deleteCookie(c, DASHBOARD_COOKIE, { path: '/dashboard' });
  return c.redirect('/dashboard/login');
});

// --- everything below requires an admin session
app.use('*', middlewareAuthDashboard);

// list of all forms
app.get('/', async c => {
  const { forms, start, days } = await navData();
  return c.html(layout('Forms', formsView(forms, start, days), { forms, active: 'forms' }));
});

// new form page
app.get('/forms/new', c => page(c, 'New form', newFormView()));

// create form, then open it so the token & snippet are right there
app.post('/forms', async c => {
  const body = await c.req.parseBody();
  const name = typeof body.name === 'string' ? body.name : '';
  const result = await Globals.ctrlForm.create({ name, userToken: c.get('userToken') });
  if (!result.status) return page(c, 'New form', newFormView(result.error || result.message, name), undefined, 400);
  return c.redirect(`/dashboard/forms/${encodeURIComponent(result.data!.token)}`);
});

// pause / resume form
app.post('/forms/:token/toggle', async c => {
  const formToken = c.req.param('token');
  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 'This form may have been deleted.', 404);

  const result = await Globals.ctrlForm.toggleActive({ formToken, active: !form.data!.isActive });
  if (!result.status) return errorPage(c, "Couldn't update the form", result.error || 'Please try again.', 500);

  // go back to the page the button was pressed on
  const referer = c.req.header('referer');
  const path = referer ? new URL(referer).pathname : '';
  return c.redirect(path.startsWith('/dashboard') ? path : '/dashboard');
});

// view form records
app.get('/forms/:token', async c => {
  const formToken = c.req.param('token');
  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 'This form may have been deleted.', 404);

  const result = await Globals.ctrlRecords.getByForm({ formToken });
  if (!result.status) return errorPage(c, "Couldn't load submissions", 'Please try again.', 500);

  const records = (result as { data: Records[] }).data;
  const { forms, start } = await navData();
  const stats = forms.find(f => f.form.token === formToken)!.stats;
  return c.html(
    layout(form.data!.name, formRecordsView(form.data!, records, stats, start, publicOrigin(c)), {
      forms,
      active: formToken,
    }),
  );
});

// download form records as CSV or JSON
app.get('/forms/:token/export', async c => {
  const formToken = c.req.param('token');
  const format = c.req.query('format') === 'csv' ? 'csv' : 'json';

  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 'This form may have been deleted.', 404);

  const result = await Globals.ctrlRecords.getByForm({ formToken });
  if (!result.status) return errorPage(c, "Couldn't load submissions", 'Please try again.', 500);

  const records = (result as { data: Records[] }).data;
  const fileName = `${safeFileName(form.data!.name)}.${format}`;
  c.header('Content-Disposition', `attachment; filename="${fileName}"`);

  if (format === 'csv') {
    c.header('Content-Type', 'text/csv; charset=utf-8');
    return c.body(recordsToCsv(records));
  }
  return c.json(records.map(r => ({ id: r.id, createdAt: r.createdAt, data: r.data })));
});

export default app;
