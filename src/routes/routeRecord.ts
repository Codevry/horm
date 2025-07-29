import { Hono } from 'hono';
import Globals from '@/utils/globals.ts';
import middlewareAuthAdmin from '@/middlewares/middlewareAuthAdmin.ts';

const app = new Hono();

// create new record
app.post('/', async c => {
  const body = await c.req.json();
  const result = await Globals.ctrlRecords.create(body);
  return c.json(result);
});

// get all records for a form
app.get('/form/:formId', middlewareAuthAdmin, async c => {
  const formId = c.req.param('formId');
  const result = await Globals.ctrlRecords.getByForm({ formToken: formId });
  return c.json(result);
});

export default app;
