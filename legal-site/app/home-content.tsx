import Image from 'next/image';
import { SiteShell } from './site-shell';
import { sitePath } from '../site-path';
import { href, type Locale, type PageId } from './locale';

type Card = { page: PageId; eyebrow: string; title: string; text: string };

const content = {
  tr: {
    eyebrow: 'Düğün Planım · Yardım merkezi',
    heading: ['Planınız sizin.', 'Verileriniz de öyle.'],
    lede: 'Düğün Planım hesap gerektirmeden ve temel özelliklerde internete ihtiyaç duymadan çalışır. Burada gizlilik yaklaşımımızı, koşulları ve destek yanıtlarını bulabilirsiniz.',
    primary: 'Gizlilik politikasını okuyun',
    secondary: 'Destek alın',
    trustLabel: 'Temel gizlilik ilkeleri',
    trust: ['Hesap yok', 'İzleme yok', 'Reklam yok', 'Yerel saklama'],
    cardsLabel: 'Bilgi sayfaları',
    open: 'Açın',
    cards: [
      {
        page: 'privacy',
        eyebrow: 'Gizlilik',
        title: 'Veriniz sizde kalır',
        text: 'Hangi verinin neden işlendiğini, hangi izinlerin kullanıldığını ve dış sunucu olmadığını açıklıyoruz.',
      },
      {
        page: 'terms',
        eyebrow: 'Koşullar',
        title: 'Sade ve anlaşılır kullanım',
        text: 'Uygulamanın kapsamı, kullanıcı sorumlulukları ve danışmanlık sınırları.',
      },
      {
        page: 'support',
        eyebrow: 'Destek',
        title: 'Yanıtı hızlıca bulun',
        text: 'Yedekleme, bildirimler, cihaz değişikliği ve veri silme hakkında sık sorulanlar.',
      },
    ] satisfies Card[],
    statementEyebrow: 'Veri kontrolü',
    statementTitle: 'Yedekleyin, taşıyın veya tamamen silin.',
    statementText:
      'Uygulama içinden sürümlü bir yedek dosyası oluşturabilir, doğrulama ve onaydan sonra geri yükleyebilir ya da tüm yerel verileri iki onayla silebilirsiniz.',
    statementLink: 'Saklama ve silme ayrıntıları',
  },
  en: {
    eyebrow: 'Düğün Planım · Help center',
    heading: ['Your plan is yours.', 'So is your data.'],
    lede: 'Düğün Planım works without an account and, for its core features, without needing the internet. Here you can find our privacy approach, the terms and answers to support questions.',
    primary: 'Read the privacy policy',
    secondary: 'Get support',
    trustLabel: 'Core privacy principles',
    trust: ['No account', 'No tracking', 'No ads', 'Local storage'],
    cardsLabel: 'Information pages',
    open: 'Open',
    cards: [
      {
        page: 'privacy',
        eyebrow: 'Privacy',
        title: 'Your data stays with you',
        text: 'We explain which data is processed and why, which permissions are used, and that there is no external server.',
      },
      {
        page: 'terms',
        eyebrow: 'Terms',
        title: 'Simple, clear use',
        text: 'The scope of the app, user responsibilities and the limits of advice.',
      },
      {
        page: 'support',
        eyebrow: 'Support',
        title: 'Find answers quickly',
        text: 'Frequently asked questions about backups, notifications, changing devices and deleting data.',
      },
    ] satisfies Card[],
    statementEyebrow: 'Data control',
    statementTitle: 'Back up, move or delete everything.',
    statementText:
      'In the app you can create a versioned backup file, restore it after validation and confirmation, or delete all local data with two confirmations.',
    statementLink: 'Retention and deletion details',
  },
} as const;

export function HomeContent({ locale }: { locale: Locale }) {
  const text = content[locale];
  return (
    <SiteShell locale={locale} page="home">
      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1 id="hero-title">
            {text.heading[0]}
            <br />
            {text.heading[1]}
          </h1>
          <p className="lede">{text.lede}</p>
          <div className="actions">
            <a className="button primary" href={href(locale, 'privacy')}>
              {text.primary}
            </a>
            <a className="button secondary" href={href(locale, 'support')}>
              {text.secondary}
            </a>
          </div>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <Image src={sitePath('/icon.png')} alt="" width={240} height={240} priority unoptimized />
        </div>
      </section>
      <section className="trust-strip" aria-label={text.trustLabel}>
        {text.trust.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>
      <section className="card-grid" aria-label={text.cardsLabel}>
        {text.cards.map((card) => (
          <a key={card.page} href={href(locale, card.page)} className="info-card">
            <p className="eyebrow">{card.eyebrow}</p>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
            <span className="card-link">
              {text.open} <span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </section>
      <section className="statement">
        <p className="eyebrow">{text.statementEyebrow}</p>
        <h2>{text.statementTitle}</h2>
        <p>{text.statementText}</p>
        <a href={href(locale, 'data-retention')}>{text.statementLink}</a>
      </section>
    </SiteShell>
  );
}
