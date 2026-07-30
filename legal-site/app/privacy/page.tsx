import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
export const metadata: Metadata = { title: 'Gizlilik Politikası' };
export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Gizlilik"
      title="Gizlilik Politikası"
      intro="Düğün Planım, kişisel planlama verilerinizi cihazınızda tutacak şekilde tasarlanmıştır."
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
        çapraz uygulama takip SDK’sı kullanılmaz. Uygulama reklam kimliği istemez.
      </p>
      <h2>3. İzinler</h2>
      <p>
        Bildirim izni, yerel görev hatırlatmalarının faydası açıklandıktan sonra ve yalnız açık seçiminizle istenir.
        Dosya seçici, yedek veya CSV dosyası seçtiğiniz anda; paylaşım ekranı ise yalnız dışa aktarma düğmesine
        bastığınızda açılır. Rehber, konum, kamera, mikrofon ve fotoğraf arşivi erişimi istenmez.
      </p>
      <h2>4. Yedekler ve paylaşımlar</h2>
      <p>
        JSON yedek, CSV veya PDF oluşturduğunuzda hedefi işletim sisteminin güvenli paylaşım ekranında siz seçersiniz.
        Bu dosyalar seçilen hedefin kurallarına tabi olur ve uygulama tarafından uzaktan yönetilemez.
      </p>
      <h2>5. Saklama ve silme</h2>
      <p>
        Veriler siz silene veya uygulamayı kaldırana kadar yerel olarak tutulur. Ayarlar içindeki “Tüm verilerimi sil”
        işlemi iki onaydan sonra uygulama verilerini ve yerel hatırlatmaları temizler.
      </p>
      <h2>6. Çocukların gizliliği ve değişiklikler</h2>
      <p>
        Uygulama özellikle çocuklara yönelik değildir. Politika değişirse yeni metin ve yürürlük tarihi bu sayfada
        yayımlanır. Nihai yayıncı iletişim bilgileri mağaza yayını öncesinde eklenmelidir.
      </p>
    </LegalLayout>
  );
}
