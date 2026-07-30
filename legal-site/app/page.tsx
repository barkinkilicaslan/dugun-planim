import Link from 'next/link';
import Image from 'next/image';
import { SiteShell } from './site-shell';

const cards = [
  {
    href: '/privacy',
    eyebrow: 'Gizlilik',
    title: 'Veriniz sizde kalır',
    text: 'Hangi verinin neden işlendiğini, hangi izinlerin kullanıldığını ve dış sunucu olmadığını açıklıyoruz.',
  },
  {
    href: '/terms',
    eyebrow: 'Koşullar',
    title: 'Sade ve anlaşılır kullanım',
    text: 'Uygulamanın kapsamı, kullanıcı sorumlulukları ve danışmanlık sınırları.',
  },
  {
    href: '/support',
    eyebrow: 'Destek',
    title: 'Yanıtı hızlıca bulun',
    text: 'Yedekleme, bildirimler, cihaz değişikliği ve veri silme hakkında sık sorulanlar.',
  },
];

export default function Home() {
  return (
    <SiteShell>
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">Düğün Planım · Yardım merkezi</p>
          <h1 id="hero-title">
            Planınız sizin.
            <br />
            Verileriniz de öyle.
          </h1>
          <p className="lede">
            Düğün Planım hesap gerektirmeden ve temel özelliklerde internete ihtiyaç duymadan çalışır. Burada gizlilik
            yaklaşımımızı, koşulları ve destek yanıtlarını bulabilirsiniz.
          </p>
          <div className="actions">
            <Link className="button primary" href="/privacy">
              Gizlilik politikasını okuyun
            </Link>
            <Link className="button secondary" href="/support">
              Destek alın
            </Link>
          </div>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <Image src="/icon.png" alt="" width={240} height={240} priority />
        </div>
      </section>
      <section className="trust-strip" aria-label="Temel gizlilik ilkeleri">
        <span>Hesap yok</span>
        <span>İzleme yok</span>
        <span>Reklam yok</span>
        <span>Yerel saklama</span>
      </section>
      <section className="card-grid" aria-label="Bilgi sayfaları">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="info-card">
            <p className="eyebrow">{card.eyebrow}</p>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
            <span className="card-link">
              Açın <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </section>
      <section className="statement">
        <p className="eyebrow">Veri kontrolü</p>
        <h2>Yedekleyin, taşıyın veya tamamen silin.</h2>
        <p>
          Uygulama içinden sürümlü bir yedek dosyası oluşturabilir, doğrulama ve onaydan sonra geri yükleyebilir ya da
          tüm yerel verileri iki onayla silebilirsiniz.
        </p>
        <Link href="/data-retention">Saklama ve silme ayrıntıları</Link>
      </section>
    </SiteShell>
  );
}
