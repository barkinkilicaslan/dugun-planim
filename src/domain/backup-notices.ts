/** Yedek/geri yükleme sırasında kullanıcıya gösterilen, davetiye fotoğraflarının yedeğe girmediğini anlatan metinler. */

export const BACKUP_PHOTO_NOTICE_TITLE = 'Davetiye fotoğrafları yedek dosyasına dahil edilmez';

export const BACKUP_PHOTO_NOTICE_BODY =
  'Yedek dosyası davetiye tasarımlarınızı ve şablon seçimlerinizi içerir, ancak davetiyelere eklediğiniz fotoğrafları içermez. Yedeği geri yüklerseniz fotoğrafları yeniden eklemeniz gerekir.';

export function restoreCompleteMessage(designCount: number): string {
  return designCount > 0
    ? `Yedek başarıyla geri yüklendi. ${designCount} davetiye tasarımı geri geldi; davetiye fotoğrafları yedek dosyasına dahil olmadığı için boş. Fotoğrafları davetiye düzenleyicisinden yeniden ekleyebilirsiniz.`
    : 'Yedek başarıyla geri yüklendi.';
}
