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

// set form active
route.put('/active', middlewareAuthAdmin, async c => {
  const body = await c.req.json();

  const result = await Globals.ctrlForm.toggleActive({
    formToken: body.formToken,
    active: true,
  });

  return c.json(result);
});

// set form inactive
route.put('/disable', middlewareAuthAdmin, async c => {
  const body = await c.req.json();

  const result = await Globals.ctrlForm.toggleActive({
    formToken: body.formToken,
    active: false,
  });

  return c.json(result);
});

// delete form
route.delete('/', middlewareAuthAdmin, async c => {
  const body = await c.req.json();

  const result = await Globals.ctrlForm.delete({
    formToken: body.formToken,
  });

  return c.json(result);
});

export default route;
