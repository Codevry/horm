import type { DataSource } from 'typeorm';
import CtrlForm from '@/controller/ctrlForm.ts';
import CtrlRecords from '@/controller/ctrlRecords.ts';

export default class Globals {
  static dataSource: DataSource;
  static ctrlForm = new CtrlForm();
  static ctrlRecords = new CtrlRecords();
}
