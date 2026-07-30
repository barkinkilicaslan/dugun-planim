import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { siteConfig } from '../site-config';

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');
  const baseUrl = host ? `${protocol}://${host}` : siteConfig.baseUrl;
  return {
    metadataBase: new URL(baseUrl),
    title: { default: 'Düğün Planım · Gizlilik ve Destek', template: '%s · Düğün Planım' },
    description: 'Düğün Planım gizlilik politikası, kullanım koşulları ve destek merkezi.',
    icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/icon.png' },
    openGraph: {
      title: 'Düğün Planım',
      description: 'Verileriniz cihazınızda kalır.',
      type: 'website',
      locale: 'tr_TR',
      images: [
        {
          url: new URL('/og.png', baseUrl).toString(),
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
      images: [new URL('/og.png', baseUrl).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
