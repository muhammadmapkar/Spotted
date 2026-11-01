// The phone side of "Back up / restore": writing the backup to a file and sharing it,
// and letting the user pick a backup file to load. The actual data work is in src/db/backup.ts.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { RestoreResult, exportBackup, restoreBackup } from './db';

// A file name with today's date, e.g. "spotted-backup-2026-11-01.json".
function backupFileName(): string {
  return `spotted-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

// Make the backup file and open the phone's share menu, so the user can save it
// to Google Drive, email it to themselves, or send it on WhatsApp.
export async function shareBackupFile(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing files is not available on this phone.');
  }
  const file = new File(Paths.cache, backupFileName());
  file.write(await exportBackup()); // replaces an older backup from the same day
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Save your Spotted backup',
  });
}

// Let the user pick a backup file and load it. Returns null if they cancelled.
export async function pickAndRestoreBackup(): Promise<RestoreResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    // Some apps save .json files as plain text or "any file", so we accept those too,
    // and check the contents ourselves in restoreBackup.
    type: ['application/json', 'text/plain', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) return null;
  const text = await new File(picked.assets[0].uri).text();
  return restoreBackup(text);
}
