import Globals from '@/utils/globals';
import { Records } from '@/entity/entityRecords.ts';

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

      // check if the form exists
      await Globals.ctrlForm.getByToken({ formToken: token });

      // create a new form
      const recordsRepository = Globals.dataSource.getRepository(Records);
      const record = new Records();
      record.data = data;
      record.form = token;

      // save form
      await recordsRepository.save(record);

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
}
