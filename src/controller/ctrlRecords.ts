import Globals from '@/utils/globals.ts';
import { type RecordRow, toRecord } from '@/entity/entityRecords.ts';
import { ENUM_JOBS } from '@/utils/enums.ts';

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
      Globals.mqQueueRecord.addJob(ENUM_JOBS.sendRecordNotification, { record, form: form.data }).then();

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

      // find all records for the form sorted by createdAt
      const records = Globals.db
        .query<RecordRow, [string]>('SELECT * FROM records WHERE formToken = ? ORDER BY createdAt DESC, id DESC')
        .all(token)
        .map(toRecord);

      // return response
      return {
        status: true,
        message: 'Records retrieved successfully',
        data: records,
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to retrieve records',
        error: error.message || '',
      };
    }
  }
}
