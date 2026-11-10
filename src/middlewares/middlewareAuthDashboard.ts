import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { findAdminByToken } from '@/utils/auth.ts';

export const DASHBOARD_COOKIE = 'horm_token';

/**
 * protects dashboard pages: requires a valid admin token in the session cookie,
 * otherwise redirects the browser to the login page
 */
export default async (c: Context, next: Next) => {
  const user = await findAdminByToken(getCookie(c, DASHBOARD_COOKIE));
  if (!user) return c.redirect('/dashboard/login');

  c.set('userToken', user.token);
  await next();
};
