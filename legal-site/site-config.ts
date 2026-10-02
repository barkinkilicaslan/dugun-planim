export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://barkinkilicaslan.github.io/dugun-planim',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'appsupportline@gmail.com',
  publisherName: process.env.NEXT_PUBLIC_PUBLISHER_NAME ?? 'Barkın Kılıçaslan',
  effectiveDate: '30 Temmuz 2026',
} as const;
