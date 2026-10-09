import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
import { pageMetadata } from '../metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata(
  'tr',
  'privacy',
  'Gizlilik Politikası',
  'Düğün Planım gizlilik politikası: planlama verileri yerel saklanır; cihaz yedekleri işletim sistemi ayarlarına bağlıdır. Hesap veya izleme yoktur.',
);
export default function PrivacyPage() {
  return (
    <LegalLayout
      locale="tr"
      page="privacy"
      eyebrow="Gizlilik"
      title="Gizlilik Politikası"
      intro="Düğün Planım planlama verilerinizi uygulamanın cihazdaki alanında saklar. İşletim sisteminiz, ayarlarınıza göre bunları cihaz yedeğine dahil edebilir."
    >
      <h2>1. Toplanan ve saklanan bilgiler</h2>
      <p>
        Çift isimleri, düğün tarihi, görevler, davetliler, masa atamaları, bütçe ve ödeme bilgileri, tedarikçiler ile
        notlar yalnız sizin girişinizle cihazdaki uygulama alanında saklanır. Düğün Planım’ın işlettiği bir kullanıcı
        hesabı veya veri sunucusu yoktur.
      </p>
      <h2>2. Veri aktarımı ve izleme</h2>
      <p>
        Uygulama verileri geliştiricinin sunucusuna gönderilmez. Reklam, üçüncü taraf analiz, davranış izleme veya
        çapraz uygulama takip SDK’sı kullanılmaz. Uygulama reklam kimliği istemez. Uygulama dilinde yaptığınız seçim
        (otomatik, Türkçe veya İngilizce) yalnız cihazınızda yerel olarak saklanır ve hiçbir yere gönderilmez. Çevrimiçi
        RSVP hizmeti yoktur; yanıt toplayan bir sunucu veya arka uç bulunmaz.
      </p>
      <h2>3. İzinler</h2>
      <p>
        Bildirim izni, yerel görev hatırlatmalarının faydası açıklandıktan sonra ve yalnız açık seçiminizle istenir.
        Rehber izni yalnızca “Rehberden davetli ekle” seçeneğine bastığınızda ve nedenini okuduktan sonra istenir;
        yalnız sizin seçtiğiniz kişilerin ad, telefon ve e-posta bilgisi davetli listenize kaydedilir, rehberin tamamı
        kopyalanmaz ve hiçbir rehber bilgisi sunucuya gönderilmez. Dosya seçici, yedek, CSV veya davetiye fotoğrafı
        seçtiğiniz anda; paylaşım, e-posta, SMS ve WhatsApp ekranları ise yalnız ilgili gönder/paylaş düğmesine
        bastığınızda açılır. Uygulama hiçbir mesajı sizin onayınız olmadan göndermez. “Kendi davetiyeni yükle”
        seçeneğinde sistemin fotoğraf veya dosya seçici ekranı açılır; uygulama yalnız sizin seçtiğiniz görsele erişir
        ve onu cihazdaki uygulama klasörüne kopyalar, fotoğraf arşivinin tamamını okumaz ve görseli sunucuya göndermez.
        Konum, kamera ve mikrofon erişimi istenmez.
      </p>
      <h2>4. Yedekler ve paylaşımlar</h2>
      <p>
        JSON yedek, CSV veya PDF oluşturduğunuzda hedefi işletim sisteminin paylaşım ekranında siz seçersiniz. JSON
        yedek dosyası uygulama tarafından şifrelenmez; davetli adları, telefon ve e-posta gibi kişisel bilgiler
        içerebilir. Yalnızca güvendiğiniz bir yerde saklayın veya paylaşın. Bu dosyalar seçilen hedefin kurallarına tabi
        olur ve uygulama tarafından uzaktan yönetilemez. Cihazınızın yedekleme ayarlarına bağlı olarak işletim sistemi
        uygulama verilerini iCloud veya Android cihaz yedeğine dahil edebilir. Bu yedekler Apple ya da Google tarafından
        yönetilir; Düğün Planım hesabı veya geliştirici sunucusu tarafından alınmaz.
      </p>
      <h2>5. Saklama ve silme</h2>
      <p>
        Veriler siz silene veya uygulamayı kaldırana kadar yerel olarak tutulur. Ayarlar içindeki “Tüm verilerimi sil”
        işlemi iki onaydan sonra uygulama verilerini, bu cihaza yüklediğiniz davetiye görsellerini ve fotoğraflarını,
        yerel hatırlatmaları, uygulamanın önbellekte tuttuğu geçici dışa aktarma dosyalarını ve seçtiğiniz görsel tarz
        tercihini temizler.
      </p>
      <h2>6. Çocukların gizliliği ve değişiklikler</h2>
      <p>
        Uygulama özellikle çocuklara yönelik değildir. Politika değişirse yeni metin ve yürürlük tarihi bu sayfada
        yayımlanır. Nihai yayıncı iletişim bilgileri mağaza yayını öncesinde eklenmelidir.
      </p>
    </LegalLayout>
  );
}
