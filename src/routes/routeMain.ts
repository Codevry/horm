import { Hono } from 'hono';
import { DbInit } from '@/database/dbInit.ts';
import Globals from '@/utils/globals.ts';
import routeForm from '@/routes/routeForm.ts';
import routeRecord from '@/routes/routeRecord.ts';
import routeDashboard from '@/routes/routeDashboard.ts';
import { logger } from 'hono/logger';

export default class RouteMain {
  private readonly app: Hono;

  constructor() {
    this.app = new Hono();
    this.app.use(logger());
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

    // browsers request /favicon.ico on their own; serve the app icon
    this.app.get('/favicon.ico', c =>
      c.body(Bun.file(new URL('../views/assets/icons/icon-32.png', import.meta.url)).stream(), 200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      }),
    );
  }

  /**
   * initialize routes
   */
  async initialize() {
    Globals.db = DbInit.initialize();
    this.defaultRoutes();
    this.app.route('/forms', routeForm);
    this.app.route('/records', routeRecord);
    this.app.route('/dashboard', routeDashboard);
    return this.app;
  }
}
