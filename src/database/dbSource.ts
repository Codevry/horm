import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '@/entity/entityUser.ts';
import { Form } from '@/entity/entityForm.ts';
import { Records } from '@/entity/entityRecords.ts'; // Assuming you have a User entity

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: Bun.env.POSTGRES_URL,
  synchronize: true, // Auto-create table schemas based on your entities (use with caution in production)
  logging: true, // Set to true to see SQL queries in your console
  entities: [User, Form, Records], // List your entities here
  migrations: [],
  subscribers: [],
});
