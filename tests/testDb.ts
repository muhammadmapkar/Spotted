import { DatabaseSync } from 'node:sqlite';

import { Db, useTestDatabase } from '../src/db/database';

// A stand-in for the phone's database, for automatic tests. It is a real SQLite database that lives
// only in memory (built into Node), so the same SQL as on the phone runs here.
function makeMemoryDb(): Db {
  const sqlite = new DatabaseSync(':memory:');
  return {
    async execAsync(sql) {
      sqlite.exec(sql);
    },
    async runAsync(sql, params = []) {
      return sqlite.prepare(sql).run(...params);
    },
    async getAllAsync<T>(sql: string, params: (string | number | null)[] = []) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: (string | number | null)[] = []) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
  };
}

// Call at the start of each test: gives the app code a brand new, empty database.
export async function freshDatabase(): Promise<void> {
  await useTestDatabase(makeMemoryDb());
}
