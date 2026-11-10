import { Hono, type Context } from 'hono';
import { csrf } from 'hono/csrf';
import { deleteCookie, setCookie } from 'hono/cookie';
import { layout } from '@/views/layout.ts';
import { formsView, newFormView } from '@/views/forms.ts';
import { loginView } from '@/views/login.ts';
import { generateHTMLTable } from '@/views/record.ts';
import Globals from '@/utils/globals.ts';
import { findAdminByToken } from '@/utils/auth.ts';
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

const errorPage = (c: Context, message: string, status: 400 | 404 | 500 = 400) =>
  c.html(
    layout('Error', `<p class="error">${message}</p><p><a href="/dashboard">← Back to forms</a></p>`, {
      loggedIn: true,
    }),
    status,
  );

// --- public: login / logout

app.get('/login', c => c.html(layout('Log in', loginView())));

app.post('/login', async c => {
  const body = await c.req.parseBody();
  const token = typeof body.token === 'string' ? body.token : '';
  const user = await findAdminByToken(token);
  if (!user) return c.html(layout('Log in', loginView('Invalid token')), 401);

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
  const result = await Globals.ctrlForm.get();
  if (!result.status) return errorPage(c, 'Failed to load forms', 500);
  return c.html(layout('Forms', formsView(result.data!), { loggedIn: true }));
});

// new form page
app.get('/forms/new', c => c.html(layout('Create Form', newFormView(), { loggedIn: true })));

// create form
app.post('/forms', async c => {
  const body = await c.req.parseBody();
  const result = await Globals.ctrlForm.create({
    name: typeof body.name === 'string' ? body.name : '',
    userToken: c.get('userToken'),
  });
  if (!result.status)
    return c.html(layout('Create Form', newFormView(result.error || result.message), { loggedIn: true }), 400);
  return c.redirect('/dashboard');
});

// enable / disable form
app.post('/forms/:token/toggle', async c => {
  const formToken = c.req.param('token');
  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 404);

  const result = await Globals.ctrlForm.toggleActive({ formToken, active: !form.data!.isActive });
  if (!result.status) return errorPage(c, 'Failed to update form', 500);
  return c.redirect('/dashboard');
});

// view form records
app.get('/forms/:token', async c => {
  const formToken = c.req.param('token');
  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 404);

  const result = await Globals.ctrlRecords.getByForm({ formToken });
  if (!result.status) return errorPage(c, 'Failed to load records', 500);

  const records = (result as { data: Records[] }).data;
  return c.html(layout(`Form "${form.data!.name}" Records`, generateHTMLTable(formToken, records), { loggedIn: true }));
});

// download form records as CSV or JSON
app.get('/forms/:token/export', async c => {
  const formToken = c.req.param('token');
  const format = c.req.query('format') === 'csv' ? 'csv' : 'json';

  const form = await Globals.ctrlForm.getByToken({ formToken });
  if (!form.status) return errorPage(c, 'Form not found', 404);

  const result = await Globals.ctrlRecords.getByForm({ formToken });
  if (!result.status) return errorPage(c, 'Failed to load records', 500);

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
