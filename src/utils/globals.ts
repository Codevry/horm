import type { DataSource } from 'typeorm';
import CtrlForm from '@/controller/ctrlForm.ts';

export default class Globals {
  static dataSource: DataSource;
  static ctrlForm = new CtrlForm();
}
