import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
import { pageMetadata } from '../metadata';
export const metadata: Metadata = pageMetadata(
  'tr',
  'data-retention',
  'Veri Saklama ve Silme',
  'Düğün Planım verilerinin cihazda nasıl saklandığı, yedeklendiği ve silindiği.',
);
export default function DataPage() {
  return (
    <LegalLayout
      locale="tr"
      page="data-retention"
      eyebrow="Veri kontrolü"
      title="Veri Saklama ve Silme"
      intro="Düğün Planım’da veri yaşam döngüsünü siz yönetirsiniz."
    >
      <h2>Cihazda saklama</h2>
      <p>
        Uygulama verileri işletim sisteminin uygulamaya ayırdığı yerel alanda saklanır. Otomatik sunucu kopyası veya
        bulut eşitlemesi yoktur.
      </p>
      <h2>Taşınabilir yedek</h2>
      <p>
        Ayarlar’dan uygulama ve şema sürümünü içeren JSON yedek oluşturabilirsiniz. Geri yüklemede dosya boyutu, biçimi,
        sürümü ve kayıtları doğrulanır; mevcut veriler ancak siz onayladıktan sonra değiştirilir. Davetiye tasarımları
        yedeğe girer, ancak davetiyelere eklediğiniz fotoğraflar yedek dosyasına dahil edilmez; geri yüklemeden sonra
        fotoğrafları yeniden eklemeniz gerekir.
      </p>
      <h2>Kalıcı silme</h2>
      <p>
        Ayarlar → Tüm verilerimi sil seçeneği iki ayrı onaydan sonra yerel veritabanını ve planlanmış bildirimleri
        temizler. Uygulamayı kaldırmak da işletim sisteminin uygulama alanını silmesine neden olur.
      </p>
      <h2>Dışa aktarılan dosyalar</h2>
      <p>
        Paylaştığınız yedek, CSV veya PDF dosyaları seçtiğiniz konumda kalır. Bu kopyaları ilgili dosya veya bulut
        hizmetinden ayrıca silmeniz gerekir.
      </p>
    </LegalLayout>
  );
}
