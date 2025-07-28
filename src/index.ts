import RouteMain from '@/routes/routeMain.ts';

const routeMain = new RouteMain();

export default {
  port: Bun.env.PORT,
  fetch: (await routeMain.initialize()).fetch,
};
