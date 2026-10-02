import { useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import type { PlainMessageKey } from '@/i18n';

type Section = readonly [title: PlainMessageKey, body: PlainMessageKey];

const PAGES: Record<string, { title: PlainMessageKey; sections: readonly Section[] }> = {
  privacy: {
    title: 'legal.privacy.title',
    sections: [
      ['legal.privacy.s1.title', 'legal.privacy.s1.body'],
      ['legal.privacy.s2.title', 'legal.privacy.s2.body'],
      ['legal.privacy.s3.title', 'legal.privacy.s3.body'],
    ],
  },
  terms: {
    title: 'legal.terms.title',
    sections: [
      ['legal.terms.s1.title', 'legal.terms.s1.body'],
      ['legal.terms.s2.title', 'legal.terms.s2.body'],
      ['legal.terms.s3.title', 'legal.terms.s3.body'],
    ],
  },
  data: {
    title: 'legal.data.title',
    sections: [
      ['legal.data.s1.title', 'legal.data.s1.body'],
      ['legal.data.s2.title', 'legal.data.s2.body'],
      ['legal.data.s3.title', 'legal.data.s3.body'],
    ],
  },
  licenses: {
    title: 'legal.licenses.title',
    sections: [
      ['legal.licenses.s1.title', 'legal.licenses.s1.body'],
      ['legal.licenses.s2.title', 'legal.licenses.s2.body'],
    ],
  },
  support: {
    title: 'legal.support.title',
    sections: [
      ['legal.support.s1.title', 'legal.support.s1.body'],
      ['legal.support.s2.title', 'legal.support.s2.body'],
      ['legal.support.s3.title', 'legal.support.s3.body'],
      ['legal.support.s4.title', 'legal.support.s4.body'],
    ],
  },
};

export default function LegalPageScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const theme = useAppTheme();
  const { t } = useI18n();
  const content = (Object.prototype.hasOwnProperty.call(PAGES, page) ? PAGES[page] : undefined) ?? PAGES.support;
  const supportEmail = String(Constants.expoConfig?.extra?.supportEmail ?? 'appsupportline@gmail.com');
  return (
    <Screen title={t(content.title)}>
      <Card>
        {content.sections.map(([title, body]) => (
          <SectionHeader key={title} title={t(title)} description={t(body)} />
        ))}
        <AppText variant="caption" color={theme.colors.muted}>
          {t('legal.draft')}
        </AppText>
        {content === PAGES.support ? (
          <AppText variant="label">{t('legal.contact', { email: supportEmail })}</AppText>
        ) : null}
      </Card>
    </Screen>
  );
}
