import { emitDataChanged } from './changes';
import { getDb } from './database';
import { UserProfile } from './types';

// The demo sign-in, kept on the phone only.
//  - `users` remembers each phone number's name and email (so a returning number skips the details step).
//  - the "session" is which phone number is signed in right now.

// Someone who has signed in on this phone before, or null.
export async function findUser(phone: string): Promise<UserProfile | null> {
  const db = await getDb();
  return db.getFirstAsync<UserProfile>('SELECT phone, name, email, createdAt FROM users WHERE phone = ?', [phone]);
}

// Remember a person's name and email (adds them, or updates them).
export async function saveUser(profile: Omit<UserProfile, 'createdAt'> & { createdAt?: string }): Promise<UserProfile> {
  const db = await getDb();
  const existing = await findUser(profile.phone);
  const saved: UserProfile = {
    phone: profile.phone,
    name: profile.name.trim(),
    email: profile.email.trim(),
    createdAt: existing?.createdAt ?? profile.createdAt ?? new Date().toISOString(),
  };
  await db.runAsync('INSERT OR REPLACE INTO users (phone, name, email, createdAt) VALUES (?, ?, ?, ?)', [
    saved.phone,
    saved.name,
    saved.email,
    saved.createdAt,
  ]);
  return saved;
}

// Who is signed in right now? (null = nobody)
export async function getSignedInUser(): Promise<UserProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'sessionPhone'");
  return row ? findUser(row.value) : null;
}

// Sign this person in (they stay signed in after the app restarts).
export async function startSession(phone: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('sessionPhone', ?)", [phone]);
  emitDataChanged();
}

// Sign out. Their name and email are remembered, so signing in again skips the details step.
export async function endSession(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM meta WHERE key = 'sessionPhone'");
  emitDataChanged();
}
