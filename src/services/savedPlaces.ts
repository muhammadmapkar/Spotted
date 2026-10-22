import { getDb } from '../db/database';

// Where the user's saved places are kept on the phone.
//
// This small file is the ONLY place that knows how they are stored (today: the phone's own database).
// When Spotted gets a backend, only this file changes; the screens keep calling the same three functions.

const KEY = 'savedPlaceIds';

// The ids of the saved places, or null if the user has never saved or removed anything yet
// (the app then starts with its sample saved places).
export async function loadSavedPlaceIds(): Promise<string[] | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [KEY]);
  if (!row) return null;
  try {
    const parsed: unknown = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : null;
  } catch {
    return null; // damaged data: start fresh instead of crashing
  }
}

export async function storeSavedPlaceIds(ids: string[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [KEY, JSON.stringify(ids)]);
}

// "Delete all my data" forgets them too.
export async function clearSavedPlaceIds(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meta WHERE key = ?', [KEY]);
}
