import { Hono } from 'hono';
import { layout } from '@/views/layout.ts';
import { formsView } from '@/views/forms.ts';
import Globals from '@/utils/globals.ts';
import { generateHTMLTable } from '@/views/record.ts';

const app = new Hono();

// list of all forms
app.get('/', async c => {
  const result: any = await Globals.ctrlForm.get();
  if (!result.error) return c.html(layout('Forms', formsView(result.data!!)));
  else return c.json(result);
});

// View form records
app.get('/forms/:id', async c => {
  const id = c.req.param('id');
  const name = c.req.query('name');
  const result: any = await Globals.ctrlRecords.getByForm({ formToken: id });
  if (!result.error) return c.html(layout(`Form "${name}" Records`, generateHTMLTable(result.data!!)));
  else return c.json(result);
});

export default app;
