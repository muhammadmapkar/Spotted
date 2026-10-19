import { emitDataChanged } from './changes';
import { getDb } from './database';
import { DEFAULT_SETTINGS, Settings } from './types';

// Read the settings. Anything never changed falls back to the default.
export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM settings WHERE id = 1');
  if (!row) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.json) };
  } catch {
    return { ...DEFAULT_SETTINGS }; // damaged data: start fresh instead of crashing
  }
}

// Save a change to one or more settings, e.g. saveSettings({ radiusMeters: 500 }).
export async function saveSettings(changes: Partial<Settings>): Promise<Settings> {
  const updated = { ...(await getSettings()), ...changes };
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (id, json) VALUES (1, ?)', [
    JSON.stringify(updated),
  ]);
  emitDataChanged();
  return updated;
}
