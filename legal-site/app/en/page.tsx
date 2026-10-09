import type { Metadata } from 'next';
import { HomeContent } from '../home-content';
import { pageMetadata } from '../metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata(
  'en',
  'home',
  undefined,
  'Düğün Planım privacy policy, terms of use and support center.',
);

export default function HomeEn() {
  return <HomeContent locale="en" />;
}
