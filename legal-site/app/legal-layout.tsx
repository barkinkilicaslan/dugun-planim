import type { ReactNode } from 'react';
import { SiteShell } from './site-shell';
import { siteConfig } from '../site-config';

export function LegalLayout({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <SiteShell>
      <article className="legal">
        <header>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{intro}</p>
          <p className="updated">Son güncelleme: {siteConfig.effectiveDate}</p>
        </header>
        <div className="legal-content">{children}</div>
      </article>
    </SiteShell>
  );
}
