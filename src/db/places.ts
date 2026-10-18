import { getDb } from './database';
import { NewPlace, SavedPlace } from './types';

// Makes a unique id like "3f2a9c1e-...". Good enough to tell places apart.
function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// The database stores "nothing" as null; our app prefers undefined.
type Row = Omit<SavedPlace, 'note' | 'reelUrl' | 'lastNotifiedAt'> & {
  note: string | null;
  reelUrl: string | null;
  lastNotifiedAt: string | null;
};

function toPlace(row: Row): SavedPlace {
  return {
    ...row,
    note: row.note ?? undefined,
    reelUrl: row.reelUrl ?? undefined,
    lastNotifiedAt: row.lastNotifiedAt ?? undefined,
  };
}

// Save a new place. Returns it with its new id and date.
export async function addPlace(input: NewPlace): Promise<SavedPlace> {
  const db = await getDb();
  const place: SavedPlace = { ...input, id: makeId(), createdAt: new Date().toISOString() };
  await db.runAsync(
    `INSERT INTO places (id, googlePlaceId, name, address, latitude, longitude, category, note, reelUrl, createdAt, lastNotifiedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      place.id,
      place.googlePlaceId,
      place.name,
      place.address,
      place.latitude,
      place.longitude,
      place.category,
      place.note ?? null,
      place.reelUrl ?? null,
      place.createdAt,
    ]
  );
  return place;
}

// All saved places, newest first.
export async function listPlaces(): Promise<SavedPlace[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM places ORDER BY createdAt DESC');
  return rows.map(toPlace);
}

// One place by id, or null if it doesn't exist.
export async function getPlace(id: string): Promise<SavedPlace | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM places WHERE id = ?', [id]);
  return row ? toPlace(row) : null;
}

// Change the parts the user can edit (category, note) - or any other field.
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
}

// Remove one place.
export async function deletePlace(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM places WHERE id = ?', [id]);
}
