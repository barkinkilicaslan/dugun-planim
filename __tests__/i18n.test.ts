import { resolveLocale, t } from '@/i18n';

describe('localization infrastructure', () => {
  it('uses Turkish as the safe fallback', () => {
    expect(resolveLocale('de')).toBe('tr');
    expect(t('tabs.tasks', 'tr')).toBe('Görevler');
  });

  it('contains a type-aligned English catalog', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(t('tabs.tasks', 'en')).toBe('Tasks');
  });
});
