import RouteMain from '@/routes/routeMain.ts';

declare module 'hono' {
  interface ContextVariableMap {
    userToken: string;
  }
}

const routeMain = new RouteMain();

export default {
  port: Bun.env.PORT,
  fetch: (await routeMain.initialize()).fetch,
};
