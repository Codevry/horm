import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { nanoid } from 'nanoid';
import { User } from './entityUser';

@Entity('forms')
@Unique(['token'])
export class Form {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: nanoid() })
  token!: string;

  @CreateDateColumn({ type: 'datetime', default: () => Date.now() })
  createdAt!: Date;

  @ManyToOne(() => User, user => user.token)
  user!: User;
}
