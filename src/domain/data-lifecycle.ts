import type { Translator } from '@/i18n';

/**
 * "Tüm verilerimi sil" ve "Yedekten geri yükle" işlemlerinin sonuçları ve kullanıcıya gösterilen doğru durum metinleri.
 */

/** Veritabanı temizlendikten sonra silinemeyen dış kalıntı türleri. */
export type DeleteLeftover =
  'reminders' | 'invitationPhotos' | 'personalInvitations' | 'exportFiles' | 'temporaryFiles';

export interface ClearAllResult {
  /** Boşsa her şey silindi. Doluysa veritabanı yine de temizlenmiştir; yalnız bu kalıntılar kalmıştır. */
  leftovers: DeleteLeftover[];
}

export interface RestoreResult {
  /** Geri yükleme sonrası bu cihazda hatırlatmaların açık olup olmadığı (işletim sistemi izniyle birlikte). */
  notificationsEnabled: boolean;
  /** Yedekte hatırlatmalar açıktı ama bu cihazda bildirim izni olmadığı için kapatıldı. */
  notificationsDowngraded: boolean;
  /** Bu cihaz için yeniden planlanan hatırlatma sayısı. */
  remindersRestored: number;
  /** Yedekte hatırlatması olup planlanamayan görev sayısı (izin yok, tarih geçmiş, planlama hatası). */
  remindersSkipped: number;
}

const LEFTOVER_KEYS: Record<DeleteLeftover, Parameters<Translator>[0]> = {
  reminders: 'settings.leftover.reminders',
  invitationPhotos: 'settings.leftover.invitationPhotos',
  personalInvitations: 'settings.leftover.personalInvitations',
  exportFiles: 'settings.leftover.exportFiles',
  temporaryFiles: 'settings.leftover.temporaryFiles',
};

export function deleteLeftoverLabels(t: Translator, leftovers: readonly DeleteLeftover[]): string {
  const labels = leftovers.map((kind) => t(LEFTOVER_KEYS[kind]));
  if (labels.length < 2) return labels.join('');
  // "a, b ve c" / "a, b and c"
  return labels.slice(0, -1).join(', ') + t('settings.leftover.and') + labels[labels.length - 1];
}

export function deletePartialBody(t: Translator, leftovers: readonly DeleteLeftover[]): string {
  return t('settings.deletePartialBody', { items: deleteLeftoverLabels(t, leftovers) });
}

/** Geri yükleme sonrası bildirim durumunu açıklayan ek satırlar (boş olabilir). */
export function restoreNotificationNotes(t: Translator, result?: RestoreResult): string[] {
  if (!result) return [];
  const notes: string[] = [];
  if (result.notificationsDowngraded) notes.push(t('backup.restoredNotificationsOff'));
  else if (result.remindersRestored > 0)
    notes.push(t('backup.restoredRemindersRestored', { count: result.remindersRestored }));
  if (result.remindersSkipped > 0 && !result.notificationsDowngraded)
    notes.push(t('backup.restoredRemindersSkipped', { count: result.remindersSkipped }));
  return notes;
}
