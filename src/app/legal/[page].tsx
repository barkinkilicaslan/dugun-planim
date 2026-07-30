import { useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useAppTheme } from '@/context/theme-context';
const pages = {
  privacy: {
    title: 'Gizlilik Politikası',
    sections: [
      [
        'Kısa özet',
        'Düğün Planım hesap açmadan çalışır. Girdiğiniz çift, görev, davetli, bütçe, masa, tedarikçi ve not verileri cihazınızdaki yerel veritabanında saklanır; bizim yönettiğimiz bir sunucuya gönderilmez.',
      ],
      [
        'İzinler',
        'Bildirim izni yalnız açıklama sonrası ve açık seçiminizle, görev hatırlatmaları için istenir. Dosya seçici ve paylaşım ekranı yalnız ilgili düğmeye dokunduğunuzda açılır. Rehber, konum, kamera, mikrofon veya izleme izni istenmez.',
      ],
      [
        'Kontrolünüz',
        'Ayarlar’dan taşınabilir yedek alabilir, geri yükleyebilir veya tüm verileri iki onayla silebilirsiniz. Paylaştığınız dosyanın hedefini işletim sistemi ekranında siz seçersiniz.',
      ],
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    sections: [
      [
        'Kullanım',
        'Uygulama kişisel düğün planlamasını kolaylaştıran yerel bir araçtır. Bilgilerin doğruluğu, cihaz yedekleri ve tedarikçi sözleşmelerinin kontrolü kullanıcı sorumluluğundadır.',
      ],
      [
        'Sorumluluk sınırı',
        'Uygulama profesyonel düğün, hukuk veya finans danışmanlığı sağlamaz. Bütçe özetleri yalnız kullanıcının girdiği verilere dayanır.',
      ],
      [
        'Değişiklikler',
        'Nihai yayıncı ve yürürlük tarihi gerçek mağaza yayını öncesinde güncellenmelidir. Bu taslak hukuki danışmanlık değildir.',
      ],
    ],
  },
  data: {
    title: 'Veri Saklama ve Silme',
    sections: [
      [
        'Saklama',
        'Uygulama verileri cihazın uygulamaya ayrılmış yerel alanında siz silene veya uygulamayı kaldırana kadar tutulur. Otomatik sunucu kopyası yoktur.',
      ],
      [
        'Yedekler',
        'Dışa aktardığınız JSON, CSV ve PDF dosyaları seçtiğiniz hedefte kalır ve uygulama içinden otomatik silinemez.',
      ],
      [
        'Silme',
        'Ayarlar → Tüm verilerimi sil işlemi iki onaydan sonra yerel uygulama verilerini ve planlanmış hatırlatmaları temizler.',
      ],
    ],
  },
  licenses: {
    title: 'Açık Kaynak Lisansları',
    sections: [
      [
        'Temel paketler',
        'React, React Native, Expo ve Expo Router MIT lisansı altında; Expo SDK modülleri ilgili paket lisansları altında kullanılır. Tam lisans metinleri dağıtılan npm paketlerinde ve proje LICENSE/THIRD_PARTY_LICENSES.md dosyalarında yer alır.',
      ],
      [
        'Bildirim',
        'Bu yazılım açık kaynak bileşenler içerir. İlgili telif bildirimleri korunur; üçüncü taraf markaları bu ürünün sponsoru değildir.',
      ],
    ],
  },
  support: {
    title: 'Destek ve Sık Sorulan Sorular',
    sections: [
      ['Verilerim nerede?', 'Veriler bu cihazda saklanır. Yeni cihaza geçmeden önce Ayarlar’dan yedek oluşturun.'],
      [
        'Bildirim gelmiyor',
        'Sistem ayarlarında Düğün Planım bildirim iznini kontrol edin ve görevde gelecekte bir son tarih ile hatırlatma seçildiğini doğrulayın.',
      ],
      [
        'Yedek açılmıyor',
        'Yalnız Düğün Planım tarafından oluşturulan, değiştirilmemiş ve desteklenen şema sürümündeki JSON yedekleri kabul edilir.',
      ],
      ['İletişim', 'Yayın öncesi destek adresi uygulama yapılandırmasından gösterilir.'],
    ],
  },
} as const;
export default function LegalPage() {
  const { page } = useLocalSearchParams<{ page: keyof typeof pages }>();
  const theme = useAppTheme();
  const content = pages[page] ?? pages.support;
  const supportEmail = String(Constants.expoConfig?.extra?.supportEmail ?? 'destek@example.com');
  return (
    <Screen title={content.title}>
      <Card>
        {content.sections.map(([title, body]) => (
          <SectionHeader key={title} title={title} description={body} />
        ))}
        <AppText variant="caption" color={theme.colors.muted}>
          Taslak sürüm · 30 Temmuz 2026
        </AppText>
        {page === 'support' ? <AppText variant="label">İletişim: {supportEmail}</AppText> : null}
      </Card>
    </Screen>
  );
}
