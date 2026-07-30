import Link from 'next/link';
import Image from 'next/image';
import type { PropsWithChildren } from 'react';
import { siteConfig } from '../site-config';

export function SiteShell({ children }: PropsWithChildren) {
  return (
    <>
      <a className="skip-link" href="#content">
        İçeriğe geç
      </a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Düğün Planım ana sayfa">
          <Image src="/icon.png" alt="" width={48} height={48} priority />
          <span>Düğün Planım</span>
        </Link>
        <nav aria-label="Ana menü">
          <Link href="/privacy">Gizlilik</Link>
          <Link href="/terms">Koşullar</Link>
          <Link href="/support">Destek</Link>
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer>
        <div>
          <strong>Düğün Planım</strong>
          <p>Hayalinizdeki günü birlikte planlayın.</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Gizlilik</Link>
          <Link href="/terms">Koşullar</Link>
          <Link href="/data-retention">Veri silme</Link>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
        </div>
        <p className="fineprint">
          Bu içerik hukuki danışmanlık değildir. Nihai yayın öncesinde yayıncı bilgileri ve hedef ülke gereksinimleri
          doğrulanmalıdır.
        </p>
      </footer>
    </>
  );
}
