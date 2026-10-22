import { emitDataChanged } from './changes';
import { getDb } from './database';

export * from './changes';
export * from './types';
export * from './collections';
export * from './places';
export * from './user';
export * from './settings';

// "Delete all my data": removes every saved place and collection, the saved sign-in profile, and resets settings to defaults
// (this also signs the user out).
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    "DELETE FROM places; DELETE FROM place_collections; DELETE FROM collections; DELETE FROM settings; DELETE FROM users; DELETE FROM meta WHERE key = 'sessionPhone';"
  );
  emitDataChanged();
}
export * from './meta';
