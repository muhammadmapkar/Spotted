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
