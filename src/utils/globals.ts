import type { DataSource } from 'typeorm';
import CtrlForm from '@/controller/ctrlForm.ts';
import CtrlRecords from '@/controller/ctrlRecords.ts';
import MessageQueue from '@/mq/queue.ts';

export default class Globals {
  static dataSource: DataSource;
  static ctrlForm = new CtrlForm();
  static ctrlRecords = new CtrlRecords();
  static mqQueueRecord: MessageQueue;
}
