import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { nanoid } from 'nanoid';
import { ENUM_ROLES } from '@/utils/enums.ts';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  name!: string;

  @Column({ default: nanoid() })
  token!: string;

  @Column({ type: 'text', enum: ENUM_ROLES, default: ENUM_ROLES.USER })
  role!: ENUM_ROLES;

  @Column({ default: true })
  isActive!: boolean;
}
