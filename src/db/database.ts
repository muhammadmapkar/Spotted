import * as SQLite from 'expo-sqlite';

// The few database actions we use. The real phone database fits this shape,
// and so does the fake one we use in automatic tests.
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: (string | number | null)[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: (string | number | null)[]): Promise<T | null>;
}

// Creates the tables the first time the app runs. Safe to run every time.
const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY NOT NULL,
    googlePlaceId TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    reelUrl TEXT,
    createdAt TEXT NOT NULL,
    lastNotifiedAt TEXT,
    muted INTEGER NOT NULL DEFAULT 0,
    visitedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    json TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS place_collections (
    placeId TEXT NOT NULL,
    collectionId TEXT NOT NULL,
    PRIMARY KEY (placeId, collectionId)
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

// Columns added after the first release. Phones that already have the database get them here,
// because CREATE TABLE IF NOT EXISTS above never changes a table that already exists.
const ADDED_COLUMNS: { table: string; column: string; definition: string }[] = [
  { table: 'places', column: 'muted', definition: 'INTEGER NOT NULL DEFAULT 0' },
  { table: 'places', column: 'visitedAt', definition: 'TEXT' },
];

// Creates the tables and adds any missing columns. Safe to run every time.
async function prepare(db: Db): Promise<void> {
  await db.execAsync(CREATE_TABLES);
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
    if (!columns.some((c) => c.name === column)) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}

let dbPromise: Promise<Db> | null = null;

// Opens the database once and reuses it everywhere.
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = (await SQLite.openDatabaseAsync('spotted.db')) as unknown as Db;
      await prepare(db);
      return db;
    })();
  }
  return dbPromise;
}

// Only for automatic tests: use a stand-in database instead of the phone's.
export async function useTestDatabase(db: Db): Promise<void> {
  await prepare(db);
  dbPromise = Promise.resolve(db);
}
