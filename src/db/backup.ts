// Back up and restore: turn all your places, collections and settings into one piece of text
// (a "backup file"), and load such a file back in. Useful when changing phones, because
// Version 1 has no cloud. Nothing here sends data anywhere; the screen decides where the file goes.

import { emitDataChanged } from './changes';
import { getDb } from './database';
import { listCollections } from './collections';
import { listPlaces } from './places';
import { getSettings } from './settings';
import { Category, Collection, DEFAULT_SETTINGS, SavedPlace, Settings } from './types';

// Bump this if the shape of the file ever changes, so old files can still be understood.
export const BACKUP_VERSION = 1;

export interface Backup {
  app: 'spotted';
  version: number;
  exportedAt: string;
  places: SavedPlace[];
  collections: Collection[];
  settings: Settings;
}

// What happened during a restore, so the screen can tell the user.
export interface RestoreResult {
  placesAdded: number;
  placesSkipped: number; // already on this phone, or damaged in the file
  collectionsAdded: number;
}

// Make the backup text (pretty-printed JSON, so a curious person can read it).
export async function exportBackup(): Promise<string> {
  const backup: Backup = {
    app: 'spotted',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    places: await listPlaces(),
    collections: await listCollections(),
    settings: await getSettings(),
  };
  return JSON.stringify(backup, null, 2);
}

// ---------- checking a file before we trust it ----------

const CATEGORIES: Category[] = ['food', 'shopping', 'fun'];
const RADII = [200, 300, 500, 1000];
const isText = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const optionalText = (v: unknown): string | undefined => (isText(v) && v !== '' ? v : undefined);
const isTime = (v: unknown): v is string => isText(v) && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

// A place from the file, or null if it is missing something important.
function readPlace(raw: unknown): SavedPlace | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (!isText(p.id) || !p.id || !isText(p.name) || !p.name) return null;
  if (!isNumber(p.latitude) || Math.abs(p.latitude) > 90) return null;
  if (!isNumber(p.longitude) || Math.abs(p.longitude) > 180) return null;
  if (!CATEGORIES.includes(p.category as Category)) return null;
  return {
    id: p.id,
    googlePlaceId: isText(p.googlePlaceId) ? p.googlePlaceId : '',
    name: p.name,
    address: isText(p.address) ? p.address : '',
    latitude: p.latitude,
    longitude: p.longitude,
    category: p.category as Category,
    note: optionalText(p.note),
    reelUrl: optionalText(p.reelUrl),
    createdAt: isText(p.createdAt) ? p.createdAt : new Date().toISOString(),
    lastNotifiedAt: optionalText(p.lastNotifiedAt),
    muted: p.muted === true,
    visitedAt: optionalText(p.visitedAt),
    snoozedUntil: optionalText(p.snoozedUntil),
    collectionIds: Array.isArray(p.collectionIds) ? p.collectionIds.filter(isText) : [],
  };
}

function readCollection(raw: unknown): Collection | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (!isText(c.id) || !isText(c.name)) return null;
  const name = c.name.trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!name) return null;
  return { id: c.id, name, createdAt: isText(c.createdAt) ? c.createdAt : new Date().toISOString() };
}

// Only settings with a sensible value are kept; anything odd falls back to the default.
function readSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;
  return {
    remindersEnabled: typeof s.remindersEnabled === 'boolean' ? s.remindersEnabled : d.remindersEnabled,
    radiusMeters: RADII.includes(s.radiusMeters as number) ? (s.radiusMeters as Settings['radiusMeters']) : d.radiusMeters,
    quietHoursEnabled: typeof s.quietHoursEnabled === 'boolean' ? s.quietHoursEnabled : d.quietHoursEnabled,
    quietStart: isTime(s.quietStart) ? s.quietStart : d.quietStart,
    quietEnd: isTime(s.quietEnd) ? s.quietEnd : d.quietEnd,
    maxRemindersPerDay:
      isNumber(s.maxRemindersPerDay) && s.maxRemindersPerDay >= 0 && s.maxRemindersPerDay <= 10
        ? Math.round(s.maxRemindersPerDay)
        : d.maxRemindersPerDay,
  };
}

// Read backup text. Throws a friendly error if it isn't a Spotted backup.
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This doesn't look like a Spotted backup file.");
  }
  const b = (data ?? {}) as Record<string, unknown>;
  if (b.app !== 'spotted' || !Array.isArray(b.places)) {
    throw new Error("This doesn't look like a Spotted backup file.");
  }
  if (isNumber(b.version) && b.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of Spotted. Please update the app first.');
  }
  return {
    app: 'spotted',
    version: isNumber(b.version) ? b.version : BACKUP_VERSION,
    exportedAt: isText(b.exportedAt) ? b.exportedAt : '',
    // Damaged places become null here; restoreBackup counts them as skipped.
    places: b.places.map(readPlace) as SavedPlace[],
    collections: (Array.isArray(b.collections) ? b.collections : []).map(readCollection).filter((c): c is Collection => c !== null),
    settings: readSettings(b.settings),
  };
}

// ---------- restoring ----------

// Load a backup into the phone. It ADDS to what is already there; it never deletes anything.
// - A place already on the phone (same id, or same Google place) is skipped, not copied twice.
// - A collection with the same name (ignoring upper/lower case) is reused, not copied.
// - Settings from the file replace the current settings.
export async function restoreBackup(text: string): Promise<RestoreResult> {
  const backup = parseBackup(text); // throws before anything is changed
  const db = await getDb();
  const result: RestoreResult = { placesAdded: 0, placesSkipped: 0, collectionsAdded: 0 };

  // 1. Collections. Remember which id in the file means which id on this phone.
  const collectionIdOnPhone = new Map<string, string>();
  for (const c of backup.collections) {
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM collections WHERE id = ? OR lower(name) = lower(?)',
      [c.id, c.name]
    );
    if (existing) {
      collectionIdOnPhone.set(c.id, existing.id);
    } else {
      await db.runAsync('INSERT INTO collections (id, name, createdAt) VALUES (?, ?, ?)', [c.id, c.name, c.createdAt]);
      collectionIdOnPhone.set(c.id, c.id);
      result.collectionsAdded++;
    }
  }

  // 2. Places, keeping their original dates, notes, reel links, muted and visited marks.
  for (const p of backup.places) {
    if (!p) {
      result.placesSkipped++;
      continue;
    }
    const existing = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM places WHERE id = ? OR (googlePlaceId = ? AND googlePlaceId != '')",
      [p.id, p.googlePlaceId]
    );
    if (existing) {
      result.placesSkipped++;
      continue;
    }
    await db.runAsync(
      `INSERT INTO places (id, googlePlaceId, name, address, latitude, longitude, category, note, reelUrl,
         createdAt, lastNotifiedAt, muted, visitedAt, snoozedUntil)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.googlePlaceId,
        p.name,
        p.address,
        p.latitude,
        p.longitude,
        p.category,
        p.note ?? null,
        p.reelUrl ?? null,
        p.createdAt,
        p.lastNotifiedAt ?? null,
        p.muted ? 1 : 0,
        p.visitedAt ?? null,
        p.snoozedUntil ?? null,
      ]
    );
    for (const fileCollectionId of new Set(p.collectionIds)) {
      const phoneId = collectionIdOnPhone.get(fileCollectionId);
      if (phoneId) {
        await db.runAsync('INSERT OR IGNORE INTO place_collections (placeId, collectionId) VALUES (?, ?)', [p.id, phoneId]);
      }
    }
    result.placesAdded++;
  }

  // 3. Settings.
  await db.runAsync('INSERT OR REPLACE INTO settings (id, json) VALUES (1, ?)', [JSON.stringify(backup.settings)]);

  emitDataChanged();
  return result;
}
