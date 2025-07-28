import { Hono } from 'hono';
import { DbInit } from '@/database/dbInit.ts';
import Globals from '@/utils/globals.ts';
import { routeUser } from '@/routes/routeUser.ts';

export default class RouteMain {
  private readonly app: Hono;

  constructor() {
    this.app = new Hono();
  }

  /**
   * default routes
   */
  defaultRoutes() {
    this.app.on(['GET', 'POST'], ['/', '/health', 'ping'], c => {
      return c.json({
        status: true,
        message: 'Server is running',
      });
    });
  }

  /**
   * initialize routes
   */
  async initialize() {
    Globals.dataSource = await DbInit.initialize();
    this.defaultRoutes();
    this.app.route('/users', routeUser);
    return this.app;
  }
}
