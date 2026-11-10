import { Hono } from 'hono';
import Globals from '@/utils/globals.ts';
import middlewareAuthAdmin from '@/middlewares/middlewareAuthAdmin.ts';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import middlewareRateLimit from '@/middlewares/middlewareRateLimit.ts';

const app = new Hono();
// CORS: "*" (default) allows any site, otherwise a comma-separated list of origins
const corsList = (Bun.env.CORS ?? '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const corsOrigin = corsList.length === 0 || corsList.includes('*') ? '*' : corsList;

// CORS for public submissions (also answers the browser's OPTIONS preflight)
app.use(
  '/',
  cors({
    origin: corsOrigin,
    allowMethods: ['POST', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
    maxAge: 600,
  }),
);

// create new record
app.post(
  '/',
  middlewareRateLimit,
  bodyLimit({
    maxSize: Math.max(1, Number(Bun.env.MAX_SUBMISSION_KB) || 100) * 1024,
    onError: c => c.json({ status: false, message: 'Submission too large' }, 413),
  }),
  async c => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ status: false, message: 'Invalid JSON body' }, 400);
    }
    const result = await Globals.ctrlRecords.create(body ?? {});
    return c.json(result);
  },
);

// get all records for a form
app.get('/form/:formId', middlewareAuthAdmin, async c => {
  const formId = c.req.param('formId');
  // optional ?page=&limit= (without limit every record is returned)
  const result = await Globals.ctrlRecords.getByForm({
    formToken: formId,
    page: c.req.query('page'),
    limit: c.req.query('limit'),
  });
  return c.json(result);
});

export default app;
