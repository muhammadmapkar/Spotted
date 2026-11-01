import { emitDataChanged } from './changes';
import { getDb } from './database';

export * from './changes';
export * from './types';
export * from './collections';
export * from './places';
export * from './user';
export * from './settings';
export * from './alerts';
export * from './backup';
export * from './inbox';

// "Delete all my data": removes every saved place, collection and waiting reel, the saved sign-in profile,
// and resets settings to defaults (this also signs the user out).
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    "DELETE FROM places; DELETE FROM place_collections; DELETE FROM collections; DELETE FROM settings; DELETE FROM inbox; DELETE FROM users; DELETE FROM meta WHERE key IN ('sessionPhone', 'savedPlaceIds') OR key LIKE 'whatsappOffers:%' OR key LIKE 'lastAlert:%';"
  );
  emitDataChanged();
}
export * from './meta';
