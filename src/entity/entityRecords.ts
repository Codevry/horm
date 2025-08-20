import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Form } from './entityForm';

@Entity('records')
export class Records {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('simple-json')
  data!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  createdAt!: Date;

  @ManyToOne(() => Form, form => form.token)
  @JoinColumn({ referencedColumnName: 'token' })
  form!: Form;
}
