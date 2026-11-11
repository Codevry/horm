import Globals from '@/utils/globals.ts';
import { type RecordRow, toRecord } from '@/entity/entityRecords.ts';
import { enqueueRecordNotifications } from '@/mq/notify.ts';

export default class CtrlRecords {
  /**
   * create a new record
   */
  async create(body: any) {
    try {
      // get name from the body
      const data = body.data;
      const token = body.formToken;

      // check if name exists
      if (!data || !token) throw new Error('data & formToken are required');

      // check if the form exists and is active
      const form = await Globals.ctrlForm.getByToken({ formToken: token });
      if (form.error) return form;
      else if (form?.data?.isActive === false)
        throw new Error('Form is disabled. Please enable the form to create a record');

      // save the record
      const row = Globals.db
        .query<
          RecordRow,
          [string, string, string]
        >('INSERT INTO records (data, createdAt, formToken) VALUES (?, ?, ?) RETURNING *')
        .get(JSON.stringify(data), new Date().toISOString(), token)!;
      const record = { ...toRecord(row), form: token };

      // trigger notification
      enqueueRecordNotifications(record, form.data!).catch(error =>
        console.error('[Queue] failed to queue notification:', error.message),
      );

      // return response
      return {
        status: true,
        message: 'Record saved successfully',
        data: record,
      };

      // else catch error and process
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to create record',
        error: error.message || '',
      };
    }
  }

  /**
   * get all records for a form
   */
  async getByForm(body: any) {
    try {
      // get form token from the body
      const token = body.formToken;

      // check if token exists
      if (!token) throw new Error('formToken is required');

      // check if the form exists
      const form = await Globals.ctrlForm.getByToken({ formToken: token });
      if (form.error) return form;

      // optional pagination: without `limit` every record is returned (newest first)
      const limit = body.limit === undefined ? undefined : Number(body.limit);
      if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 500))
        throw new Error('limit must be a whole number between 1 and 500');

      if (limit === undefined) {
        const records = Globals.db
          .query<RecordRow, [string]>('SELECT * FROM records WHERE formToken = ? ORDER BY createdAt DESC, id DESC')
          .all(token)
          .map(toRecord);

        return {
          status: true,
          message: 'Records retrieved successfully',
          data: records,
        };
      }

      const { total } = Globals.db
        .query<{ total: number }, [string]>('SELECT COUNT(*) AS total FROM records WHERE formToken = ?')
        .get(token)!;
      const pages = Math.max(1, Math.ceil(total / limit));
      const requested = Number(body.page ?? 1);
      const page = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;

      const records = Globals.db
        .query<RecordRow, [string, number, number]>(
          'SELECT * FROM records WHERE formToken = ? ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?',
        )
        .all(token, limit, (page - 1) * limit)
        .map(toRecord);

      return {
        status: true,
        message: 'Records retrieved successfully',
        data: records,
        pagination: { page, limit, total, pages },
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to retrieve records',
        error: error.message || '',
      };
    }
  }

  /**
   * delete records of a form by id (ids belonging to other forms are ignored)
   */
  delete(body: { formToken?: string; ids?: unknown[] }) {
    try {
      const token = body.formToken;
      if (!token) throw new Error('formToken is required');

      const ids = [...new Set((body.ids ?? []).map(Number).filter(id => Number.isInteger(id) && id > 0))];
      if (ids.length === 0) throw new Error('ids are required');
      if (ids.length > 500) throw new Error('at most 500 records can be deleted at once');

      const { changes } = Globals.db
        .query(`DELETE FROM records WHERE formToken = ? AND id IN (${ids.map(() => '?').join(',')})`)
        .run(token, ...ids);

      return {
        status: true,
        message: `${changes} record${changes === 1 ? '' : 's'} deleted`,
        data: { deleted: changes },
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to delete records',
        error: error.message || '',
      };
    }
  }

  /**
   * per-form submission stats: total, last submission and a daily histogram of the last `days` days (UTC)
   */
  stats(days = 14) {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const stats = new Map<string, FormStats>();
    const get = (token: string) => {
      let s = stats.get(token);
      if (!s) stats.set(token, (s = { total: 0, last: null, daily: new Array(days).fill(0) }));
      return s;
    };

    const totals = Globals.db
      .query<
        { formToken: string; total: number; last: string },
        []
      >('SELECT formToken, COUNT(*) AS total, MAX(createdAt) AS last FROM records GROUP BY formToken')
      .all();
    for (const row of totals) Object.assign(get(row.formToken), { total: row.total, last: new Date(row.last) });

    const daily = Globals.db
      .query<{ formToken: string; day: string; count: number }, [string]>(
        `SELECT formToken, substr(createdAt, 1, 10) AS day, COUNT(*) AS count
         FROM records WHERE createdAt >= ? GROUP BY formToken, day`,
      )
      .all(start.toISOString());
    for (const row of daily) {
      const index = Math.round((Date.parse(row.day) - start.getTime()) / 86_400_000);
      if (index >= 0 && index < days) get(row.formToken).daily[index] = row.count;
    }

    return { days, start, stats, empty: (): FormStats => ({ total: 0, last: null, daily: new Array(days).fill(0) }) };
  }
}

export interface FormStats {
  total: number;
  last: Date | null;
  daily: number[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
