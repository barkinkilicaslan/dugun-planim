import { APP_VERSION, SCHEMA_VERSION, type AppData } from './models';
import { t } from '@/i18n';
import { validateAppData, ValidationError } from './validation';
import { INVITATION_PALETTES } from './invitation-templates';

export const BACKUP_FORMAT = 'dugun-planim-backup';

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  /** Kendi davetiye görselleri yedeğe girmez; bu yüzden `personalInvitations` alanı yoktur. */
  payload: Omit<AppData, 'personalInvitations'>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertUniqueIds(collections: readonly (readonly { id: string }[])[]): void {
  for (const collection of collections) {
    const ids = new Set<string>();
    for (const item of collection) {
      if (typeof item.id !== 'string' || item.id.trim() === '' || ids.has(item.id))
        throw new ValidationError(t('backup.invalidStructure'));
      ids.add(item.id);
    }
  }
}

function assertSupportedValues(data: AppData): void {
  const currencies = ['TRY', 'EUR', 'USD', 'GBP'];
  const themes = ['light', 'dark', 'system'];
  const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD'];
  const priorities = ['low', 'medium', 'high'];
  const sides = ['couple1', 'couple2', 'common'];
  const groups = ['family', 'friends', 'work', 'other'];
  const contractStatuses = ['researching', 'quoted', 'signed', 'completed'];
  const paletteIds = new Set<string>(INVITATION_PALETTES.map((palette) => palette.id));

  if (
    !currencies.includes(data.profile.currency) ||
    !themes.includes(data.profile.theme) ||
    !dateFormats.includes(data.profile.dateFormat) ||
    data.tasks.some((task) => !priorities.includes(task.priority) || typeof task.completed !== 'boolean') ||
    data.guests.some((guest) => !sides.includes(guest.side) || !groups.includes(guest.group)) ||
    data.vendors.some((vendor) => !contractStatuses.includes(vendor.contractStatus)) ||
    data.invitationDesigns.some((design) => !paletteIds.has(design.paletteId))
  )
    throw new ValidationError(t('backup.invalidStructure'));
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
  if (!isRecord(parsed)) throw new ValidationError(t('backup.invalidStructure'));
  const envelope = parsed as Partial<BackupEnvelope>;
  if (envelope.format !== BACKUP_FORMAT) throw new ValidationError(t('backup.wrongFormat'));
  if (
    typeof envelope.schemaVersion !== 'number' ||
    !Number.isInteger(envelope.schemaVersion) ||
    envelope.schemaVersion < 1 ||
    envelope.schemaVersion > SCHEMA_VERSION
  )
    throw new ValidationError(t('backup.unsupportedSchema', { version: String(envelope.schemaVersion) }));
  if (
    typeof envelope.appVersion !== 'string' ||
    typeof envelope.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(envelope.exportedAt)) ||
    !isRecord(envelope.payload)
  )
    throw new ValidationError(t('backup.invalidStructure'));

  let data: AppData;
  try {
    data = validateAppData({ ...envelope.payload, personalInvitations: [] } as AppData);
  } catch (error) {
    // Malformed JSON can otherwise leak TypeErrors from field validators to the UI.
    if (error instanceof ValidationError) throw error;
    throw new ValidationError(t('backup.invalidStructure'));
  }

  assertUniqueIds([
    data.tasks,
    data.guests,
    data.tables,
    data.venueLayoutItems,
    data.budgetItems,
    data.vendors,
    data.notes,
    data.invitationDesigns,
  ]);
  assertSupportedValues(data);

  const tableIds = new Set(data.tables.map((table) => table.id));
  const vendorIds = new Set(data.vendors.map((vendor) => vendor.id));
  if (
    data.guests.some((guest) => guest.tableId && !tableIds.has(guest.tableId)) ||
    data.budgetItems.some((item) => item.vendorId && !vendorIds.has(item.vendorId))
  )
    throw new ValidationError(t('backup.invalidStructure'));

  return data;
}
