// "Reels to sort": reel links the user pasted in one go, waiting to be turned into places.
// The user still confirms each place one at a time in Add Place (we never guess for them).

import { emitDataChanged } from './changes';
import { getDb } from './database';
import { makeId } from './ids';

export interface InboxReel {
  id: string;
  url: string;
  addedAt: string;
}

// Add links to the list. Links already in the list, or already saved on a place, are skipped.
// Returns how many were really added.
export async function addToInbox(urls: string[]): Promise<number> {
  const db = await getDb();
  let added = 0;
  for (const url of new Set(urls)) {
    const known = await db.getFirstAsync<{ found: number }>(
      'SELECT 1 AS found FROM inbox WHERE url = ? UNION SELECT 1 FROM places WHERE reelUrl = ?',
      [url, url]
    );
    if (known) continue;
    await db.runAsync('INSERT INTO inbox (id, url, addedAt) VALUES (?, ?, ?)', [makeId(), url, new Date().toISOString()]);
    added++;
  }
  if (added) emitDataChanged();
  return added;
}

// The waiting links, oldest first (the order they were pasted).
export async function listInbox(): Promise<InboxReel[]> {
  const db = await getDb();
  return db.getAllAsync<InboxReel>('SELECT id, url, addedAt FROM inbox ORDER BY addedAt ASC, rowid ASC');
}

// Take one link off the list (it was sorted, or the user removed it).
export async function removeFromInbox(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM inbox WHERE id = ?', [id]);
  emitDataChanged();
}
