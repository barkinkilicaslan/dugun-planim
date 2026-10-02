import { siteConfig } from '../site-config';
import { sitePath } from '../site-path';

export type Locale = 'tr' | 'en';
export type PageId = 'home' | 'privacy' | 'terms' | 'data-retention' | 'support';

export const LOCALES: readonly Locale[] = ['tr', 'en'];
export const PAGE_IDS: readonly PageId[] = ['home', 'privacy', 'terms', 'data-retention', 'support'];

/** Sayfanın yayın yolu (basePath hariç). Türkçe adresler değişmez; İngilizce adresler `/en` altındadır. */
export function localePathname(locale: Locale, page: PageId): string {
  const segment = page === 'home' ? '' : `/${page}`;
  if (locale === 'en') return `/en${segment}`;
  return segment || '/';
}

/** Dahili bağlantılar için basePath eklenmiş yol. */
export function href(locale: Locale, page: PageId): string {
  return sitePath(localePathname(locale, page));
}

/** Kanonik ve dil alternatifi bağlantıları için mutlak, sonu `/` ile biten adres. */
export function absoluteUrl(locale: Locale, page: PageId): string {
  const base = siteConfig.baseUrl.replace(/\/$/, '');
  const pathname = localePathname(locale, page);
  return `${base}${pathname === '/' ? '/' : `${pathname}/`}`;
}

export const otherLocale = (locale: Locale): Locale => (locale === 'tr' ? 'en' : 'tr');

export const shellText = {
  tr: {
    skip: 'İçeriğe geç',
    homeLabel: 'Düğün Planım ana sayfa',
    menuLabel: 'Ana menü',
    privacy: 'Gizlilik',
    terms: 'Koşullar',
    support: 'Destek',
    dataDeletion: 'Veri silme',
    tagline: 'Hayalinizdeki günü birlikte planlayın.',
    publisher: 'Yayıncı',
    disclaimer:
      'Bu içerik hukuki danışmanlık değildir. Nihai yayın öncesinde yayıncı bilgileri ve hedef ülke gereksinimleri doğrulanmalıdır.',
    updated: 'Son güncelleme',
    switchLabel: 'English',
    switchAria: 'Read this page in English',
    effectiveDate: siteConfig.effectiveDate,
  },
  en: {
    skip: 'Skip to content',
    homeLabel: 'Düğün Planım home page',
    menuLabel: 'Main menu',
    privacy: 'Privacy',
    terms: 'Terms',
    support: 'Support',
    dataDeletion: 'Data deletion',
    tagline: 'Plan your dream day together.',
    publisher: 'Publisher',
    disclaimer:
      'This content is not legal advice. Publisher details and target-country requirements should be verified before final release.',
    updated: 'Last updated',
    switchLabel: 'Türkçe',
    switchAria: 'Bu sayfayı Türkçe okuyun',
    effectiveDate: siteConfig.effectiveDateEn,
  },
} as const;
