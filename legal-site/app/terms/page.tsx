import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
import { pageMetadata } from '../metadata';
export const metadata: Metadata = pageMetadata(
  'tr',
  'terms',
  'Kullanım Koşulları',
  'Düğün Planım uygulamasının kullanım koşulları, kullanıcı sorumlulukları ve danışmanlık sınırları.',
);
export default function TermsPage() {
  return (
    <LegalLayout
      locale="tr"
      page="terms"
      eyebrow="Koşullar"
      title="Kullanım Koşulları"
      intro="Bu taslak, Düğün Planım uygulamasının kişisel planlama amacıyla kullanımına ilişkin temel çerçeveyi açıklar."
    >
      <h2>1. Hizmetin kapsamı</h2>
      <p>
        Düğün Planım görev, davetli, bütçe, masa, tedarikçi ve not bilgilerinin cihaz üzerinde düzenlenmesini sağlayan
        bir araçtır. Hesap veya bulut eşitleme hizmeti sunmaz.
      </p>
      <h2>2. Kullanıcı sorumluluğu</h2>
      <p>
        Girdiğiniz bilgilerin doğruluğu, cihaz güvenliği, düzenli yedek alınması, tedarikçi sözleşmeleri ve gerçek ödeme
        kayıtlarının doğrulanması sizin sorumluluğunuzdadır.
      </p>
      <h2>3. Danışmanlık değildir</h2>
      <p>
        Uygulama profesyonel düğün, hukuk veya finans danışmanlığı sağlamaz. Bütçe özetleri yalnız girdiğiniz tutarlara
        dayanan matematiksel sunumlardır.
      </p>
      <h2>4. Kabul edilebilir kullanım</h2>
      <p>
        Uygulamayı hukuka aykırı amaçlarla, üçüncü kişilerin haklarını ihlal edecek biçimde veya cihaz güvenliğini
        tehlikeye atacak şekilde kullanamazsınız.
      </p>
      <h2>5. Sorumluluk ve değişiklikler</h2>
      <p>
        Yasaların izin verdiği ölçüde, dolaylı zararlar ve kullanıcı tarafından girilen yanlış bilgilerden doğan
        sonuçlar için garanti verilmez. Nihai yayıncı bilgileri, uygulanacak hukuk ve uyuşmazlık hükümleri yayın öncesi
        hukuk danışmanıyla doğrulanmalıdır.
      </p>
    </LegalLayout>
  );
}
