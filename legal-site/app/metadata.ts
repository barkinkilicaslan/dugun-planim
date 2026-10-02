import type { Metadata } from 'next';
import { absoluteUrl, otherLocale, type Locale, type PageId } from './locale';

/**
 * Sayfa başına kanonik adres ve dil alternatifleri. Adresler mutlak ve GitHub Pages yoluna (`/dugun-planim`) göredir;
 * böylece `metadataBase` yol kırpması sorun çıkarmaz.
 */
export function pageMetadata(locale: Locale, page: PageId, title: string | undefined, description?: string): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: {
      canonical: absoluteUrl(locale, page),
      languages: {
        [locale]: absoluteUrl(locale, page),
        [otherLocale(locale)]: absoluteUrl(otherLocale(locale), page),
        'x-default': absoluteUrl('tr', page),
      },
    },
  };
}
