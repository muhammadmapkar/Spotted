import { emitDataChanged } from './changes';
import { getDb } from './database';

export * from './changes';
export * from './types';
export * from './collections';
export * from './places';
export * from './settings';

// "Delete all my data": removes every saved place and collection, and resets settings to defaults.
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM places; DELETE FROM place_collections; DELETE FROM collections; DELETE FROM settings;');
  emitDataChanged();
}
export * from './meta';
