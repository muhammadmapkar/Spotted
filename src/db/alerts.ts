import { getDb } from './database';

// When each saved Spotted place last sent a "nearby" alert, so the same place never alerts twice in a day.
// (Places saved from reels keep this time in their own row. The catalogue places have no row, so it lives here.)

export async function getLastAlertAt(placeId: string): Promise<string | undefined> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [`lastAlert:${placeId}`]);
  return row?.value;
}

export async function setLastAlertAt(placeId: string, isoTime: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [`lastAlert:${placeId}`, isoTime]);
}
