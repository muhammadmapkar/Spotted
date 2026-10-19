import { emitDataChanged } from './changes';
import { getDb } from './database';
import { makeId } from './ids';
import { Collection } from './types';

export const MAX_COLLECTION_NAME = 40;

// A collection together with how many places are in it.
export interface CollectionWithCount extends Collection {
  placeCount: number;
}

// Tidy a name the user typed: trim, squash extra spaces, limit the length.
export function cleanCollectionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_COLLECTION_NAME);
}

// All collections, oldest first (the order the user made them).
export async function listCollections(): Promise<Collection[]> {
  const db = await getDb();
  return db.getAllAsync<Collection>('SELECT id, name, createdAt FROM collections ORDER BY createdAt ASC, rowid ASC');
}

// Collections plus how many places each one holds (for the Manage screen).
export async function listCollectionsWithCounts(): Promise<CollectionWithCount[]> {
  const db = await getDb();
  return db.getAllAsync<CollectionWithCount>(
    `SELECT c.id, c.name, c.createdAt,
            (SELECT COUNT(*) FROM place_collections pc WHERE pc.collectionId = c.id) AS placeCount
     FROM collections c ORDER BY c.createdAt ASC, c.rowid ASC`
  );
}

// Make a collection. If one with the same name already exists (ignoring upper/lower case),
// that one is returned instead of making a copy. An empty name throws an error.
export async function addCollection(name: string): Promise<Collection> {
  const clean = cleanCollectionName(name);
  if (!clean) throw new Error('A collection needs a name.');
  const db = await getDb();
  const existing = await db.getFirstAsync<Collection>(
    'SELECT id, name, createdAt FROM collections WHERE lower(name) = lower(?)',
    [clean]
  );
  if (existing) return existing;
  const collection: Collection = { id: makeId(), name: clean, createdAt: new Date().toISOString() };
  await db.runAsync('INSERT INTO collections (id, name, createdAt) VALUES (?, ?, ?)', [
    collection.id,
    collection.name,
    collection.createdAt,
  ]);
  emitDataChanged();
  return collection;
}

// Rename a collection. Throws if the new name is empty or another collection already has it.
export async function renameCollection(id: string, name: string): Promise<void> {
  const clean = cleanCollectionName(name);
  if (!clean) throw new Error('A collection needs a name.');
  const db = await getDb();
  const clash = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM collections WHERE lower(name) = lower(?) AND id != ?',
    [clean, id]
  );
  if (clash) throw new Error('You already have a collection with that name.');
  await db.runAsync('UPDATE collections SET name = ? WHERE id = ?', [clean, id]);
  emitDataChanged();
}

// Delete a collection. The places in it are NOT deleted; they just leave the collection.
export async function deleteCollection(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM place_collections WHERE collectionId = ?', [id]);
  await db.runAsync('DELETE FROM collections WHERE id = ?', [id]);
  emitDataChanged();
}
