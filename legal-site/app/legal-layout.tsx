import type { ReactNode } from 'react';
import { SiteShell } from './site-shell';
import { shellText, type Locale, type PageId } from './locale';

export function LegalLayout({
  locale,
  page,
  eyebrow,
  title,
  intro,
  children,
}: {
  locale: Locale;
  page: PageId;
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const text = shellText[locale];
  return (
    <SiteShell locale={locale} page={page}>
      <article className="legal">
        <header>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{intro}</p>
          <p className="updated">
            {text.updated}: {text.effectiveDate}
          </p>
        </header>
        <div className="legal-content">{children}</div>
      </article>
    </SiteShell>
  );
}
