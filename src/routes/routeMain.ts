import { Hono } from 'hono';
import { DbInit } from '@/database/dbInit.ts';

export default class RouteMain {
  private readonly app: Hono;

  constructor() {
    this.app = new Hono();
  }

  /**
   * initialize routes
   */
  async initialize() {
    await DbInit.initialize();
    return this.app;
  }
}
