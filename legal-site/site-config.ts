export const siteConfig = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com/dugun-planim',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'destek@example.com',
  publisherName: process.env.NEXT_PUBLIC_PUBLISHER_NAME ?? '{{YAYINCI_ADI}}',
  effectiveDate: '30 Temmuz 2026',
} as const;
