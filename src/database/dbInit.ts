import { DataSource } from 'typeorm';
import { AppDataSource } from './dbSource';
import { User } from '@/entity/entityUser';
import { ENUM_ROLES } from '@/utils/enums.ts';

export class DbInit {
  /**
   * initialize db
   */
  static async initialize(): Promise<DataSource> {
    try {
      const dataSource = await AppDataSource.initialize();
      console.log('Data Source initialized!');

      await DbInit.createDefaultUserIfNotExists(dataSource);

      return dataSource;
    } catch (error) {
      console.error('Error during Data Source initialization:', error);
      throw error;
    }
  }

  private static async createDefaultUserIfNotExists(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const userCount = await userRepository.count();

    if (userCount === 0) {
      try {
        const defaultUser = new User();
        defaultUser.name = 'admin';
        defaultUser.role = ENUM_ROLES.ADMIN;

        const savedUser = await userRepository.save(defaultUser);
        console.log('Default user created successfully:', savedUser);
      } catch (error) {
        console.error('Error creating default user:', error);
      }
    } else {
      console.log('Default user already exists');
      const adminUser = await userRepository.findOne({ where: { id: 1 } });

      console.log('Default admin user:', adminUser);
    }
  }
}
