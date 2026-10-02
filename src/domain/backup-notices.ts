import type { Translator } from '@/i18n';

/** Yedek/geri yükleme sırasında kullanıcıya gösterilen, davetiye fotoğraflarının yedeğe girmediğini anlatan metinler. */

export function backupPhotoNoticeTitle(t: Translator): string {
  return t('backup.photoNoticeTitle');
}

export function backupPhotoNoticeBody(t: Translator): string {
  return t('backup.photoNoticeBody');
}

export function restoreCompleteMessage(t: Translator, designCount: number): string {
  return designCount > 0 ? t('backup.restoredWithDesigns', { count: designCount }) : t('backup.restoredPlain');
}
