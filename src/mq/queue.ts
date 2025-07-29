import { type ConnectionOptions, Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { ENUM_JOBS } from '@/utils/enums.ts';

export default class MessageQueue {
  private readonly queue: Queue;
  private readonly name: string;
  private readonly connection: ConnectionOptions;

  constructor(connection: ConnectionOptions, name: string) {
    this.name = name;
    this.connection = connection;
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
    const queueEvents = new QueueEvents(this.name, { connection: this.connection });

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
