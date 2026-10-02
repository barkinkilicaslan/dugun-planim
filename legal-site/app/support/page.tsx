import type { Metadata } from 'next';
import { LegalLayout } from '../legal-layout';
import { siteConfig } from '../../site-config';
export const metadata: Metadata = { title: 'Destek ve SSS' };
export default function SupportPage() {
  return (
    <LegalLayout
      eyebrow="Yardım merkezi"
      title="Destek ve Sık Sorulan Sorular"
      intro="Planınızı güvende tutmak ve yaygın sorunları çözmek için kısa yanıtlar."
    >
      <h2>Verilerim nerede?</h2>
      <p>Verileriniz bu cihazdaki uygulama alanında saklanır. Geliştirici sunucusuna gönderilmez.</p>
      <h2>Yeni cihaza nasıl geçerim?</h2>
      <p>
        Eski cihazda Ayarlar → Yedek dosyası oluştur seçeneğini kullanın. Dosyayı güvenli bir hedefe kaydedin, yeni
        cihazda “Yedekten geri yükle” ile seçin ve özetini onaylayın. Davetiye fotoğrafları yedeğe dahil edilmez; yeni
        cihazda yeniden eklemeniz gerekir.
      </p>
      <h2>Bildirim neden gelmedi?</h2>
      <p>
        Sistem ayarlarında Düğün Planım bildirim iznini kontrol edin. Görevin gelecekte bir son tarihi olmalı ve
        düzenleme ekranında bir gün önce hatırlatma açık olmalıdır. İzin reddedilse bile uygulamanın diğer özellikleri
        çalışır.
      </p>
      <h2>Bozuk yedek uyarısı alıyorum</h2>
      <p>
        Yalnız Düğün Planım’ın oluşturduğu, desteklenen şema sürümündeki ve değiştirilmemiş JSON yedekleri kabul edilir.
        Hatalı dosya mevcut verinizi değiştirmez.
      </p>
      <h2>Davetli CSV başlıkları nelerdir?</h2>
      <p>Sıra şu olmalıdır: ad, telefon, taraf, kisi_sayisi, cocuk_sayisi, rsvp, grup, yemek_alerji, notlar.</p>
      <h2>İletişim</h2>
      <p>
        Destek adresi: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. Uygulamayla ilgili
        destek talepleriniz için bu adresten bize ulaşabilirsiniz.
      </p>
    </LegalLayout>
  );
}
