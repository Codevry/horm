import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { nanoid } from 'nanoid';
import { toUser, type UserRow } from '@/entity/entityUser.ts';
import { ENUM_ROLES } from '@/utils/enums.ts';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    token    TEXT    NOT NULL UNIQUE,
    role     TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    isActive INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS forms (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    token     TEXT    NOT NULL UNIQUE,
    createdAt TEXT    NOT NULL,
    isActive  INTEGER NOT NULL DEFAULT 1,
    userToken TEXT    REFERENCES users (token) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS records (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    data      TEXT    NOT NULL,
    createdAt TEXT    NOT NULL,
    formToken TEXT    NOT NULL REFERENCES forms (token) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_records_form ON records (formToken, createdAt);
`;

export class DbInit {
  /**
   * open (and create if needed) the sqlite database
   * location is taken from SQLITE_PATH, defaults to ./data/horm.sqlite
   */
  static initialize(path: string = Bun.env.SQLITE_PATH || 'data/horm.sqlite'): Database {
    try {
      if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

      const db = new Database(path, { create: true, strict: true });
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA busy_timeout = 5000;');
      db.exec(SCHEMA);
      console.log(`Database initialized at ${path}`);

      DbInit.createDefaultUserIfNotExists(db);
      return db;
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    }
  }

  private static createDefaultUserIfNotExists(db: Database): void {
    const { count } = db.query<{ count: number }, []>('SELECT COUNT(*) AS count FROM users').get()!;

    if (count === 0) {
      const row = db
        .query<UserRow, [string, string, string]>('INSERT INTO users (name, token, role) VALUES (?, ?, ?) RETURNING *')
        .get('admin', nanoid(), ENUM_ROLES.ADMIN)!;
      console.log('Default user created successfully:', toUser(row));
    } else {
      console.log('Default user already exists');
      const admin = db
        .query<UserRow, [string]>('SELECT * FROM users WHERE role = ? ORDER BY id LIMIT 1')
        .get(ENUM_ROLES.ADMIN);
      console.log('Default admin user:', admin ? toUser(admin) : null);
    }
  }
}
