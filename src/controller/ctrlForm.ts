import { type Form, type FormRow, toForm } from '@/entity/entityForm.ts';
import { nanoid } from 'nanoid';
import Globals from '@/utils/globals.ts';

/**
 * find a form row by token, throws if it does not exist
 */
function findFormOrThrow(token: string): Form {
  const row = Globals.db.query<FormRow, [string]>('SELECT * FROM forms WHERE token = ?').get(token);
  if (!row) throw new Error('Form not found');
  return toForm(row);
}

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

      // create & save a new form
      const row = Globals.db
        .query<
          FormRow,
          [string, string, string, string | null]
        >('INSERT INTO forms (name, token, createdAt, userToken) VALUES (?, ?, ?, ?) RETURNING *')
        .get(name, nanoid(), new Date().toISOString(), user ?? null)!;
      const form = { ...toForm(row), user };

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
      // find all forms sorted by createdAt
      const forms = Globals.db
        .query<FormRow, []>('SELECT * FROM forms ORDER BY createdAt DESC, id DESC')
        .all()
        .map(toForm);

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

      // find form by token
      const form = findFormOrThrow(formToken);

      // update form active state
      Globals.db.query('UPDATE forms SET isActive = ? WHERE token = ?').run(active ? 1 : 0, formToken);
      form.isActive = active;

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

  /**
   * Delete form by token
   */
  async delete(body: any) {
    try {
      // get form token
      const formToken = body.formToken;

      if (!formToken) throw new Error('formToken is required');

      // find form by token
      const form = findFormOrThrow(formToken);

      // delete form (its records are removed with it)
      Globals.db.query('DELETE FROM forms WHERE token = ?').run(formToken);

      // return response
      return {
        status: true,
        message: 'Form deleted successfully',
        data: form,
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to delete form',
        error: error.message || '',
      };
    }
  }

  /**
   * Get form by token
   */
  async getByToken(body: any) {
    try {
      // get form token
      const formToken = body.formToken;

      if (!formToken) throw new Error('formToken is required');

      // find form by token
      const form = findFormOrThrow(formToken);

      // return response
      return {
        status: true,
        message: 'Form retrieved successfully',
        data: form,
      };
    } catch (error: Error | any) {
      return {
        status: false,
        message: 'Failed to retrieve form',
        error: error.message || '',
      };
    }
  }
}
