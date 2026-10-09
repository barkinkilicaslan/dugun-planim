import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
import { pageMetadata } from '../metadata';

export const dynamic = 'force-static';

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
        Uygulama verileri işletim sisteminin uygulamaya ayırdığı yerel alanda saklanır; uygulamanın kendi sunucu kopyası
        veya eşitleme hizmeti yoktur. Cihazınızın yedekleme ayarlarına bağlı olarak işletim sistemi uygulama verilerini
        iCloud veya Android cihaz yedeğine dahil edebilir. Bu yedekleri ilgili platform yönetir; geliştirici almaz.
      </p>
      <h2>Taşınabilir yedek</h2>
      <p>
        Ayarlar’dan uygulama ve şema sürümünü içeren JSON yedek oluşturabilirsiniz. Geri yüklemede dosya boyutu, biçimi,
        sürümü ve kayıtları doğrulanır; mevcut veriler ancak siz onayladıktan sonra değiştirilir. JSON yedeği uygulama
        tarafından şifrelenmez ve kişisel bilgiler içerebilir; saklarken veya paylaşırken dikkat edin. Davetiye
        tasarımları yedeğe girer, ancak davetiyelere eklediğiniz fotoğraflar yedek dosyasına dahil edilmez; geri
        yüklemeden sonra fotoğrafları yeniden eklemeniz gerekir. “Kendi davetiyeni yükle” ile yüklediğiniz davetiye
        görselleri de yedeğe girmez; aynı cihazda geri yüklerseniz korunur, başka cihazda yeniden yüklemeniz gerekir.
      </p>
      <h2>Kalıcı silme</h2>
      <p>
        Ayarlar → Tüm verilerimi sil seçeneği iki ayrı onaydan sonra yerel veritabanını, bu cihaza yüklediğiniz davetiye
        görsellerini ve fotoğraflarını, planlanmış bildirimleri, uygulamanın önbellekte tuttuğu geçici dışa aktarma
        dosyalarını ve seçtiğiniz görsel tarz tercihini temizler. Bir kalıntı silinemezse uygulama bunu size bildirir ve
        sonraki açılışta yeniden dener. Uygulamayı kaldırmak da işletim sisteminin uygulama alanını silmesine neden
        olur.
      </p>
      <h2>Dışa aktarılan dosyalar</h2>
      <p>
        Paylaşım için oluşturulan geçici kopyalar uygulamanın önbelleğinde kısa süre tutulur; sonraki dışa aktarmada,
        uygulama açılışında veya uygulama bir saat ya da daha uzun süre sonra öne geldiğinde otomatik silinir.
        Paylaştığınız yedek, CSV veya PDF dosyaları seçtiğiniz konumda kalır. Bu kopyaları ilgili dosya veya bulut
        hizmetinden ayrıca silmeniz gerekir.
      </p>
    </LegalLayout>
  );
}
