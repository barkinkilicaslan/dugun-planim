import type { Metadata } from 'next';
import { HomeContent } from './home-content';
import { pageMetadata } from './metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata('tr', 'home', undefined);

export default function Home() {
  return <HomeContent locale="tr" />;
}
