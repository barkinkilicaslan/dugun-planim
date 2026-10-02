import Image from 'next/image';
import type { PropsWithChildren } from 'react';
import { siteConfig } from '../site-config';
import { sitePath } from '../site-path';

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <>
      <a className="skip-link" href="#content">
        İçeriğe geç
      </a>
      <header className="site-header">
        <a href={sitePath('/')} className="brand" aria-label="Düğün Planım ana sayfa">
          <Image src={sitePath('/icon.png')} alt="" width={48} height={48} priority unoptimized />
          <span>Düğün Planım</span>
        </a>
        <nav aria-label="Ana menü">
          <a href={sitePath('/privacy')}>Gizlilik</a>
          <a href={sitePath('/terms')}>Koşullar</a>
          <a href={sitePath('/support')}>Destek</a>
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer>
        <div>
          <strong>Düğün Planım</strong>
          <p>Hayalinizdeki günü birlikte planlayın.</p>
        </div>
        <div className="footer-links">
          <a href={sitePath('/privacy')}>Gizlilik</a>
          <a href={sitePath('/terms')}>Koşullar</a>
          <a href={sitePath('/data-retention')}>Veri silme</a>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
        </div>
        <p className="fineprint">Yayıncı: {siteConfig.publisherName}</p>
        <p className="fineprint">
          Bu içerik hukuki danışmanlık değildir. Nihai yayın öncesinde yayıncı bilgileri ve hedef ülke gereksinimleri
          doğrulanmalıdır.
        </p>
      </footer>
    </>
  );
}
