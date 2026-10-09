import type { Translator } from '@/i18n';
import { restoreNotificationNotes, type RestoreResult } from './data-lifecycle';

/** Yedek/geri yükleme sırasında kullanıcıya gösterilen, davetiye fotoğraflarının yedeğe girmediğini anlatan metinler. */

export function backupPhotoNoticeTitle(t: Translator): string {
  return t('backup.photoNoticeTitle');
}

export function backupPhotoNoticeBody(t: Translator): string {
  return t('backup.photoNoticeBody');
}

/** Yedek oluşturma uyarısı: fotoğrafların girmediği ve dosyanın şifresiz kişisel veri taşıdığı. */
export function backupCreateNoticeBody(t: Translator): string {
  return [t('backup.photoNoticeBody'), t('backup.plainTextNotice')].join('\n\n');
}

export function restoreCompleteMessage(t: Translator, designCount: number, result?: RestoreResult): string {
  const base = designCount > 0 ? t('backup.restoredWithDesigns', { count: designCount }) : t('backup.restoredPlain');
  return [base, ...restoreNotificationNotes(t, result)].join('\n\n');
}
