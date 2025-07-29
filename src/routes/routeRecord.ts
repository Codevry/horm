import { Hono } from 'hono';
import Globals from '@/utils/globals.ts';

const app = new Hono();

app.post('/', async c => {
  const body = await c.req.json();
  const result = await Globals.ctrlRecords.create(body);
  return c.json(result);
});

export default app;
