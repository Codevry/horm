import type { Database } from 'bun:sqlite';
import CtrlForm from '@/controller/ctrlForm.ts';
import CtrlRecords from '@/controller/ctrlRecords.ts';
import CtrlSettings from '@/controller/ctrlSettings.ts';
import MessageQueue from '@/mq/queue.ts';

export default class Globals {
  static db: Database;
  static ctrlForm = new CtrlForm();
  static ctrlRecords = new CtrlRecords();
  static ctrlSettings = new CtrlSettings();
  static mqQueueRecord: MessageQueue | null = null;
}
