import RouteMain from '@/routes/routeMain.ts';
import Globals from '@/utils/globals.ts';
import MessageQueue from '@/mq/queue.ts';

declare module 'hono' {
  interface ContextVariableMap {
    userToken: string;
  }
}

Globals.mqQueueRecord = new MessageQueue('newRecord');
const routeMain = new RouteMain();

export default {
  port: Bun.env.PORT,
  fetch: (await routeMain.initialize()).fetch,
};
