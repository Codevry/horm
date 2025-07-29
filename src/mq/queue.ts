import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { ENUM_JOBS } from '@/utils/enums.ts';

const connection = new IORedis({ db: 1 });

export default class MessageQueue {
  private readonly queue: Queue;
  private readonly name: string;

  constructor(name: string) {
    this.name = name;
    this.queue = new Queue(this.name, { connection });
    this.events();
  }

  /**
   * add a new job to the queue
   * @param name
   * @param data
   */
  async addJob(name: ENUM_JOBS, data: any) {
    const job = await this.queue.add(name, data);
    console.log(`[Queue ${this.name}] Job ${job.id} (${name}) added`);
  }

  /**
   * get events of queue
   */
  events() {
    const queueEvents = new QueueEvents(this.name, { connection });

    queueEvents.on('waiting', ({ jobId }) => {
      console.log(`[Queue ${this.name}] Job ${jobId} waiting`);
    });

    queueEvents.on('active', ({ jobId, prev }) => {
      console.log(`[Queue ${this.name}] Job ${jobId} active (prev: ${prev})`);
    });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`[Queue ${this.name}] Job ${jobId} completed with result: ${returnvalue}`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.log(`[Queue ${this.name}] Job ${jobId} failed: ${failedReason}`);
    });
  }
}
