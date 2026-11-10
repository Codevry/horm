import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { UserRow } from '@/entity/entityUser.ts';
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
    userToken TEXT    REFERENCES users (token) ON DELETE SET NULL,
    settings  TEXT
  );

  CREATE TABLE IF NOT EXISTS records (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    data      TEXT    NOT NULL,
    createdAt TEXT    NOT NULL,
    formToken TEXT    NOT NULL REFERENCES forms (token) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_records_form ON records (formToken, createdAt);

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/**
 * small additive migrations for databases created by older versions
 */
function migrate(db: Database) {
  const formColumns = db
    .query<{ name: string }, []>('PRAGMA table_info(forms)')
    .all()
    .map(c => c.name);
  if (!formColumns.includes('settings')) db.exec('ALTER TABLE forms ADD COLUMN settings TEXT');
}

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
      migrate(db);
      console.log(`Database initialized at ${path}`);

      DbInit.createDefaultUserIfNotExists(db);
      return db;
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    }
  }

  /**
   * the admin token comes from ADMIN_TOKEN (required); the first admin user is created
   * or updated so its token always matches the env value
   */
  private static createDefaultUserIfNotExists(db: Database): void {
    const token = (Bun.env.ADMIN_TOKEN ?? '').trim();
    if (token.length < 16) {
      console.error('ADMIN_TOKEN is required and must be at least 16 characters (e.g. `openssl rand -hex 24`).');
      process.exit(1);
    }

    const admin = db
      .query<UserRow, [string]>('SELECT * FROM users WHERE role = ? ORDER BY id LIMIT 1')
      .get(ENUM_ROLES.ADMIN);

    if (!admin) {
      db.query('INSERT INTO users (name, token, role) VALUES (?, ?, ?)').run('admin', token, ENUM_ROLES.ADMIN);
      console.log('Admin user created with ADMIN_TOKEN');
    } else if (admin.token !== token) {
      db.transaction(() => {
        db.exec('PRAGMA defer_foreign_keys = ON');
        db.query('UPDATE users SET token = ?, isActive = 1 WHERE id = ?').run(token, admin.id);
        db.query('UPDATE forms SET userToken = ? WHERE userToken = ?').run(token, admin.token);
      })();
      console.log('Admin token updated from ADMIN_TOKEN');
    } else {
      console.log('Admin user ready (ADMIN_TOKEN)');
    }
  }
}
