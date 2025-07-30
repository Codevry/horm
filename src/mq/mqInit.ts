import IORedis from 'ioredis';
import Globals from '@/utils/globals.ts';
import MessageQueue from '@/mq/queue.ts';
import WorkerRecordNew from '@/mq/workerRecordNew.ts';
import { ENUM_QUEUE } from '@/utils/enums.ts';

const connection = new IORedis(Bun.env.REDIS_URL, { maxRetriesPerRequest: null });

// --- new record queue
Globals.mqQueueRecord = new MessageQueue(connection, ENUM_QUEUE.newRecord);
WorkerRecordNew(ENUM_QUEUE.newRecord, connection);
