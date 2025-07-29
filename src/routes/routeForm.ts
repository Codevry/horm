import { Hono } from 'hono';
import middlewareAuthAdmin from '@/middlewares/middlewareAuthAdmin.ts';
import Globals from '@/utils/globals.ts';

const route = new Hono();

// create a new form
route.post('/', middlewareAuthAdmin, async c => {
  const body = await c.req.json();
  body.userToken = c.get('userToken');

  const result = await Globals.ctrlForm.create(body);
  return c.json(result);
});

// get all forms (sorted by createdAt)
route.get('/', middlewareAuthAdmin, async c => {
  const result = await Globals.ctrlForm.get();
  return c.json(result);
});

export default route;
