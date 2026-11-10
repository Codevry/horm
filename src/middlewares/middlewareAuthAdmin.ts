import type { Context, Next } from 'hono';
import { findAdminByToken } from '@/utils/auth.ts';

export default async (c: Context, next: Next) => {
  const token = c.req.header('Authorization');

  // check if token provided
  if (!token) {
    return c.json({
      status: false,
      message: 'No token provided',
    });
  }

  // check if a user exists and has a role of admin
  const user = await findAdminByToken(token);
  if (!user)
    return c.json({
      status: false,
      message: 'Invalid token',
    });

  // else process further
  c.set('userToken', user.token);
  await next();
};
