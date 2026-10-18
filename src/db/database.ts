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
    lastNotifiedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    json TEXT NOT NULL
  );
`;

let dbPromise: Promise<Db> | null = null;

// Opens the database once and reuses it everywhere.
export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('spotted.db');
      await db.execAsync(CREATE_TABLES);
      return db as unknown as Db;
    })();
  }
  return dbPromise;
}

// Only for automatic tests: use a stand-in database instead of the phone's.
export async function useTestDatabase(db: Db): Promise<void> {
  await db.execAsync(CREATE_TABLES);
  dbPromise = Promise.resolve(db);
}
