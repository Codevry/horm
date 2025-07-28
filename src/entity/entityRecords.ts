import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Form } from './entityForm';

@Entity('records')
export class Records {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('simple-json')
  data!: Record<string, unknown>;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @ManyToOne(() => Form, form => form.token)
  form!: Form;
}
