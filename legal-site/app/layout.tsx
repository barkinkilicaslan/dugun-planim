import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '../site-config';

const siteUrl = siteConfig.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Düğün Planım · Gizlilik ve Destek', template: '%s · Düğün Planım' },
  description: 'Düğün Planım gizlilik politikası, kullanım koşulları ve destek merkezi.',
  icons: {
    icon: `${siteUrl}/favicon.png`,
    shortcut: `${siteUrl}/favicon.png`,
    apple: `${siteUrl}/icon.png`,
  },
  openGraph: {
    title: 'Düğün Planım',
    description: 'Verileriniz cihazınızda kalır.',
    type: 'website',
    locale: 'tr_TR',
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: 'Düğün Planım — Verileriniz cihazınızda kalır.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Düğün Planım',
    description: 'Verileriniz cihazınızda kalır.',
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
