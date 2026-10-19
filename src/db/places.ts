import { emitDataChanged } from './changes';
import { Db, getDb } from './database';
import { makeId } from './ids';
import { NewPlace, SavedPlace } from './types';

// The database stores "nothing" as null; our app prefers undefined.
type Row = Omit<SavedPlace, 'note' | 'reelUrl' | 'lastNotifiedAt' | 'collectionIds'> & {
  note: string | null;
  reelUrl: string | null;
  lastNotifiedAt: string | null;
};

function toPlace(row: Row, collectionIds: string[]): SavedPlace {
  return {
    ...row,
    note: row.note ?? undefined,
    reelUrl: row.reelUrl ?? undefined,
    lastNotifiedAt: row.lastNotifiedAt ?? undefined,
    collectionIds,
  };
}

// Replace which collections a place is in. (A collection id that doesn't exist is ignored.)
async function setMemberships(db: Db, placeId: string, collectionIds: string[]): Promise<void> {
  await db.runAsync('DELETE FROM place_collections WHERE placeId = ?', [placeId]);
  for (const collectionId of new Set(collectionIds)) {
    await db.runAsync(
      `INSERT OR IGNORE INTO place_collections (placeId, collectionId)
       SELECT ?, id FROM collections WHERE id = ?`,
      [placeId, collectionId]
    );
  }
}

// Save a new place. Returns it with its new id and date.
export async function addPlace(input: NewPlace): Promise<SavedPlace> {
  const db = await getDb();
  const { collectionIds = [], ...fields } = input;
  const id = makeId();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO places (id, googlePlaceId, name, address, latitude, longitude, category, note, reelUrl, createdAt, lastNotifiedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      id,
      fields.googlePlaceId,
      fields.name,
      fields.address,
      fields.latitude,
      fields.longitude,
      fields.category,
      fields.note ?? null,
      fields.reelUrl ?? null,
      createdAt,
    ]
  );
  await setMemberships(db, id, collectionIds);
  emitDataChanged();
  // Read it back so the result shows exactly what was stored (only real collections).
  return (await getPlace(id))!;
}

// All saved places, newest first.
export async function listPlaces(): Promise<SavedPlace[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM places ORDER BY createdAt DESC');
  const links = await db.getAllAsync<{ placeId: string; collectionId: string }>(
    'SELECT placeId, collectionId FROM place_collections'
  );
  const byPlace = new Map<string, string[]>();
  for (const link of links) {
    byPlace.set(link.placeId, [...(byPlace.get(link.placeId) ?? []), link.collectionId]);
  }
  return rows.map((row) => toPlace(row, byPlace.get(row.id) ?? []));
}

// One place by id, or null if it doesn't exist.
export async function getPlace(id: string): Promise<SavedPlace | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM places WHERE id = ?', [id]);
  if (!row) return null;
  const links = await db.getAllAsync<{ collectionId: string }>(
    'SELECT collectionId FROM place_collections WHERE placeId = ?',
    [id]
  );
  return toPlace(row, links.map((link) => link.collectionId));
}

// Change the parts the user can edit (category, note, collections) - or any other field.
// Leave `collectionIds` out to keep the place's collections as they are.
export async function updatePlace(
  id: string,
  changes: Partial<Omit<SavedPlace, 'id' | 'createdAt'>>
): Promise<void> {
  const current = await getPlace(id);
  if (!current) return;
  const p = { ...current, ...changes };
  const db = await getDb();
  await db.runAsync(
    `UPDATE places SET googlePlaceId = ?, name = ?, address = ?, latitude = ?, longitude = ?,
       category = ?, note = ?, reelUrl = ?, lastNotifiedAt = ? WHERE id = ?`,
    [
      p.googlePlaceId,
      p.name,
      p.address,
      p.latitude,
      p.longitude,
      p.category,
      p.note ?? null,
      p.reelUrl ?? null,
      p.lastNotifiedAt ?? null,
      id,
    ]
  );
  if (changes.collectionIds !== undefined) {
    await setMemberships(db, id, changes.collectionIds);
  }
  emitDataChanged();
}

// Remove one place (and its place in any collections).
export async function deletePlace(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM places WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM place_collections WHERE placeId = ?', [id]);
  emitDataChanged();
}
