import { Form } from '@/entity/entityForm';
import { nanoid } from 'nanoid';
import Globals from '@/utils/globals';

export default class CtrlForm {
  /**
   * create a new form
   */
  async create(body: any) {
    try {
      // get name from the body
      const name = body.name?.trim();
      const user = body.userToken;

      // check if name exists
      if (!name) throw new Error('Form name is required');

      // create a new form
      const formRepository = Globals.dataSource.getRepository(Form);
      const form = new Form();
      form.token = nanoid();
      form.name = name;
      form.user = user;

      // save form
      await formRepository.save(form);

      // return response
      return {
        status: true,
        message: 'Form created successfully',
        data: form,
      };

      // else catch error and process
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to create form',
        error: error.message || '',
      };
    }
  }
}
