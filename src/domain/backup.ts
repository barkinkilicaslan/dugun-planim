import { APP_VERSION, SCHEMA_VERSION, type AppData } from './models';
import { validateAppData, ValidationError } from './validation';

export const BACKUP_FORMAT = 'dugun-planim-backup';

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  payload: AppData;
}

export function createBackup(data: AppData, now = new Date()): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    payload: data,
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseBackup(raw: string): AppData {
  if (raw.length > 10_000_000) throw new ValidationError('Yedek dosyası izin verilen boyutu aşıyor.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError('Yedek dosyası geçerli JSON içermiyor.');
  }
  if (!parsed || typeof parsed !== 'object') throw new ValidationError('Yedek yapısı geçersiz.');
  const envelope = parsed as Partial<BackupEnvelope>;
  if (envelope.format !== BACKUP_FORMAT) throw new ValidationError('Bu dosya Düğün Planım yedeği değil.');
  if (envelope.schemaVersion !== SCHEMA_VERSION)
    throw new ValidationError(`Yedek şema sürümü desteklenmiyor: ${String(envelope.schemaVersion)}.`);
  return validateAppData(envelope.payload as AppData);
}
