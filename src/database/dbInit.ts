import { DataSource } from 'typeorm';
import { AppDataSource } from './dbSource';

export class DbInit {
  /**
   * initialize db
   */
  static async initialize(): Promise<DataSource> {
    try {
      const dataSource = await AppDataSource.initialize();
      console.log('Data Source initialized!');
      return dataSource;
    } catch (error) {
      console.error('Error during Data Source initialization:', error);
      throw error;
    }
  }
}
