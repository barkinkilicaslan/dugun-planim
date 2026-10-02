import type { Metadata } from 'next';
import { siteConfig } from '../../site-config';

const siteUrl = siteConfig.baseUrl.replace(/\/$/, '');

/** İngilizce sayfalar için başlık şablonu ve paylaşım meta verileri (kök yerleşim Türkçedir). */
export const metadata: Metadata = {
  title: { default: 'Düğün Planım · Privacy and Support', template: '%s · Düğün Planım' },
  description: 'Düğün Planım privacy policy, terms of use and support center.',
  openGraph: {
    title: 'Düğün Planım',
    description: 'Your data stays on your device.',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: 'Düğün Planım — Your data stays on your device.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Düğün Planım',
    description: 'Your data stays on your device.',
    images: [`${siteUrl}/og.png`],
  },
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
