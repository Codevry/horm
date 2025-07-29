import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Form } from './entityForm';

@Entity('records')
export class Records {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('simple-json')
  data!: Record<string, unknown>;

  @CreateDateColumn({ type: 'datetime', default: () => Date.now() })
  createdAt!: Date;

  @ManyToOne(() => Form, form => form.token)
  @JoinColumn({ referencedColumnName: 'token' })
  form!: Form;
}
