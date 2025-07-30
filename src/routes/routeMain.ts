import { Hono } from 'hono';
import { DbInit } from '@/database/dbInit.ts';
import Globals from '@/utils/globals.ts';
import routeForm from '@/routes/routeForm.ts';
import routeRecord from '@/routes/routeRecord.ts';
import routeDashboard from '@/routes/routeDashboard.ts';

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
    this.app.route('/forms', routeForm);
    this.app.route('/records', routeRecord);
    this.app.route('/dashboard', routeDashboard);
    return this.app;
  }
}
