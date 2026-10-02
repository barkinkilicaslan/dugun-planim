import Image from 'next/image';
import type { PropsWithChildren } from 'react';
import { siteConfig } from '../site-config';
import { sitePath } from '../site-path';
import { href, otherLocale, shellText, type Locale, type PageId } from './locale';

export function SiteShell({ locale, page, children }: PropsWithChildren<{ locale: Locale; page: PageId }>) {
  const text = shellText[locale];
  const alternate = otherLocale(locale);
  const switchLink = (
    <a
      className="lang-switch"
      href={href(alternate, page)}
      lang={alternate}
      hrefLang={alternate}
      aria-label={text.switchAria}
    >
      {text.switchLabel}
    </a>
  );
  return (
    <div lang={locale}>
      <a className="skip-link" href="#content">
        {text.skip}
      </a>
      <header className="site-header">
        <a href={href(locale, 'home')} className="brand" aria-label={text.homeLabel}>
          <Image src={sitePath('/icon.png')} alt="" width={48} height={48} priority unoptimized />
          <span>Düğün Planım</span>
        </a>
        <nav aria-label={text.menuLabel}>
          <a href={href(locale, 'privacy')}>{text.privacy}</a>
          <a href={href(locale, 'terms')}>{text.terms}</a>
          <a href={href(locale, 'support')}>{text.support}</a>
          {switchLink}
        </nav>
      </header>
      <main id="content">{children}</main>
      <footer>
        <div>
          <strong>Düğün Planım</strong>
          <p>{text.tagline}</p>
        </div>
        <div className="footer-links">
          <a href={href(locale, 'privacy')}>{text.privacy}</a>
          <a href={href(locale, 'terms')}>{text.terms}</a>
          <a href={href(locale, 'data-retention')}>{text.dataDeletion}</a>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
          {switchLink}
        </div>
        <p className="fineprint">
          {text.publisher}: {siteConfig.publisherName}
        </p>
        <p className="fineprint">{text.disclaimer}</p>
      </footer>
    </div>
  );
}
