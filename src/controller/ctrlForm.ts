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

  /**
   * get all forms sorted by createdAt
   */
  async get() {
    try {
      // get form repository
      const formRepository = Globals.dataSource.getRepository(Form);

      // find all forms sorted by createdAt
      const forms = await formRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });

      // return response
      return {
        status: true,
        message: 'Forms retrieved successfully',
        data: forms,
      };

      // catch any error
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to retrieve forms',
        error: error.message || '',
      };
    }
  }

  /**
   * Toggle form active state
   */
  async toggleActive(body: any) {
    try {
      // check formToken & active status
      const formToken = body.formToken;
      const active = body.active || false;

      if (!formToken) throw new Error('formToken is required');

      // get form repository
      const formRepository = Globals.dataSource.getRepository(Form);

      // find form by token
      const form = await formRepository.findOneBy({ token: formToken });
      if (!form) throw new Error('Form not found');

      // update form active state
      form.isActive = active;
      await formRepository.save(form);

      // return response
      return {
        status: true,
        message: `Form ${active ? 'enabled' : 'disabled'} successfully`,
        data: form,
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to update form status',
        error: error.message || '',
      };
    }
  }
}
