import Globals from '@/utils/globals.ts';
import MessageQueue from '@/mq/queue.ts';
import WorkerRecordNew from '@/mq/workerRecordNew.ts';
import { ENUM_QUEUE } from '@/utils/enums.ts';
import { redis } from '@/utils/redis.ts';
import { notifyChannels } from '@/mq/notify.ts';

if (redis) {
  // --- new record queue
  Globals.mqQueueRecord = new MessageQueue(redis, ENUM_QUEUE.newRecord);
  WorkerRecordNew(ENUM_QUEUE.newRecord, redis);
} else if (notifyChannels().length) {
  console.warn('[Queue] NOTIFY_CHANNELS is set but REDIS_URL is not: notifications are disabled');
}
