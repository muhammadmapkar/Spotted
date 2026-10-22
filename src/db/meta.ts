import { getDb } from './database';

// Small "remember this" notes about the app itself (not about places).

// Has the user already seen the welcome and permission screens?
export async function getOnboardingDone(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'onboardingDone'");
  return row?.value === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('onboardingDone', 'true')");
}

// Testing only: forget that onboarding was done, so the welcome screens show again.
export async function resetOnboarding(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM meta WHERE key = 'onboardingDone'");
}

// The user's light/dark choice: 'system' (follow the phone, the default), 'light' or 'dark'.
export type ThemePreference = 'system' | 'light' | 'dark';

export async function getThemePreference(): Promise<ThemePreference> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'themePreference'");
  return row?.value === 'light' || row?.value === 'dark' ? row.value : 'system';
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('themePreference', ?)", [preference]);
}
