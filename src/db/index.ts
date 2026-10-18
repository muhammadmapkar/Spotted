import { getDb } from './database';

export * from './types';
export * from './places';
export * from './settings';

// "Delete all my data": removes every saved place and resets settings to defaults.
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM places; DELETE FROM settings;');
}
export * from './sampleData';
