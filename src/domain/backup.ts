import { APP_VERSION, SCHEMA_VERSION, type AppData } from './models';
import { t } from '@/i18n';
import { validateAppData, ValidationError } from './validation';

export const BACKUP_FORMAT = 'dugun-planim-backup';

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  /** Kendi davetiye görselleri yedeğe girmez; bu yüzden `personalInvitations` alanı yoktur. */
  payload: Omit<AppData, 'personalInvitations'>;
}

export function createBackup(data: AppData, now = new Date()): string {
  const { personalInvitations: _personalInvitations, ...rest } = data;
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    // Davetiye fotoğrafları ve kişisel davetiye görselleri yedeğe dahil edilmez; cihaz içi dosya yolu da yazılmaz.
    payload: { ...rest, invitationDesigns: data.invitationDesigns.map((design) => ({ ...design, photoUri: '' })) },
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseBackup(raw: string): AppData {
  if (raw.length > 10_000_000) throw new ValidationError(t('backup.tooLarge'));
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError(t('backup.invalidJson'));
  }
  if (!parsed || typeof parsed !== 'object') throw new ValidationError(t('backup.invalidStructure'));
  const envelope = parsed as Partial<BackupEnvelope>;
  if (envelope.format !== BACKUP_FORMAT) throw new ValidationError(t('backup.wrongFormat'));
  if (
    typeof envelope.schemaVersion !== 'number' ||
    envelope.schemaVersion < 1 ||
    envelope.schemaVersion > SCHEMA_VERSION
  )
    throw new ValidationError(t('backup.unsupportedSchema', { version: String(envelope.schemaVersion) }));
  return validateAppData({ ...envelope.payload, personalInvitations: [] } as AppData);
}
