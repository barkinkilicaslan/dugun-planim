import { formatMoney } from '@/domain/calculations';
import {
  formatLong,
  formatLongWithWeekday,
  formatMonthYear,
  formatNumeric,
  formatTime,
  formatTimestampDate,
  isoFromLocalDate,
  localDateFromIso,
} from '@/domain/wedding-date';
import {
  createTranslator,
  DEFAULT_LOCALE,
  getActiveLocale,
  LOCALE_META,
  resolveFromDeviceLocales,
  resolveLocale,
  resolvePreference,
  setActiveLocale,
  SUPPORTED_LOCALES,
  t,
  translate,
  type MessageKey,
} from '@/i18n';
import { en } from '@/i18n/en';
import { tr } from '@/i18n/tr';

describe('locale resolution', () => {
  it.each([
    ['tr', 'tr'],
    ['en', 'en'],
    ['de', 'tr'],
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['en_AU', 'en'],
    ['EN-us', 'en'],
    ['tr-TR', 'tr'],
    ['tr-CY', 'tr'],
    ['fr-CA', 'tr'],
    ['ar', 'tr'],
    ['', 'tr'],
  ])('maps the language code %s to %s', (code, expected) => {
    expect(resolveLocale(code)).toBe(expected);
  });

  it('falls back to Turkish when there is no language code', () => {
    expect(resolveLocale(undefined)).toBe('tr');
    expect(resolveLocale(null)).toBe('tr');
    expect(DEFAULT_LOCALE).toBe('tr');
  });

  it('decides by language code, never by country', () => {
    expect(resolveLocale('en-TR')).toBe('en');
    expect(resolveLocale('tr-US')).toBe('tr');
  });

  it('picks the first supported language of the device preference list', () => {
    expect(resolveFromDeviceLocales([{ languageCode: 'de' }, { languageCode: 'en' }])).toBe('en');
    expect(resolveFromDeviceLocales([{ languageCode: 'de' }, { languageCode: 'fr' }])).toBe('tr');
    expect(resolveFromDeviceLocales([{ languageCode: null, languageTag: 'en-GB' }])).toBe('en');
    expect(resolveFromDeviceLocales([{ languageCode: 'tr', languageTag: 'tr-TR' }, { languageCode: 'en' }])).toBe('tr');
    expect(resolveFromDeviceLocales([])).toBe('tr');
  });

  it('manual choices override the device language in both directions', () => {
    const english = [{ languageCode: 'en' }];
    const turkish = [{ languageCode: 'tr' }];
    expect(resolvePreference('tr', english)).toBe('tr');
    expect(resolvePreference('en', turkish)).toBe('en');
    expect(resolvePreference('auto', english)).toBe('en');
    expect(resolvePreference('auto', turkish)).toBe('tr');
    expect(resolvePreference('auto', [{ languageCode: 'ja' }])).toBe('tr');
  });

  it('keeps the architecture ready for another direction without enabling RTL now', () => {
    for (const locale of SUPPORTED_LOCALES) expect(LOCALE_META[locale].direction).toBe('ltr');
  });
});

describe('message catalogs', () => {
  const sample = new Proxy({}, { get: () => 1 });
  const keys = Object.keys(tr) as MessageKey[];

  it('English has exactly the same keys as Turkish', () => {
    expect(Object.keys(en).sort()).toEqual([...keys].sort());
    expect(keys.length).toBeGreaterThan(700);
  });

  it('every message renders to a non-empty string in both languages', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) {
        const entry = (locale === 'tr' ? tr : en)[key] as string | ((params: unknown) => string);
        const text = typeof entry === 'function' ? entry(sample) : entry;
        expect(typeof text).toBe('string');
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('English messages contain no leftover Turkish text', () => {
    const allowed = new Set(['language.tr']);
    for (const key of keys) {
      if (allowed.has(key)) continue;
      const entry = en[key] as string | ((params: unknown) => string);
      const text = (typeof entry === 'function' ? entry(sample) : entry).replace(/Düğün Planım/g, '');
      expect({ key, turkish: /[ğüşıöçĞÜŞİÖÇ]/.test(text) }).toEqual({ key, turkish: false });
    }
  });

  it('plural and parameter messages work in English', () => {
    expect(translate('en', 'home.daysLeft', { days: 1 })).toBe('1 day');
    expect(translate('en', 'home.daysLeft', { days: 25 })).toBe('25 days');
    expect(translate('en', 'home.daysLeftSentence', { days: 25 })).toBe('25 days until your wedding');
    expect(translate('tr', 'home.daysLeftSentence', { days: 25 })).toBe('Düğününüze 25 gün kaldı');
    expect(translate('tr', 'contacts.subtitle', { count: 3 })).toBe('3 kişi seçildi');
    expect(translate('en', 'contacts.subtitle', { count: 3 })).toBe('3 contacts selected');
    expect(translate('en', 'contacts.subtitle', { count: 1 })).toBe('1 contact selected');
    expect(translate('tr', 'home.attendingCount', { count: 12 })).toBe('12 katılıyor');
    expect(translate('en', 'home.attendingCount', { count: 12 })).toBe('12 attending');
    expect(translate('en', 'invitation.defaultName', { template: 'Classic' })).toBe('Classic invitation');
  });

  it('a missing or broken message never throws', () => {
    expect(translate('en', 'no.such.key' as MessageKey)).toBe('no.such.key');
    expect(translate('tr', 'no.such.key' as MessageKey)).toBe('no.such.key');
    // Parametre verilmeden çağrılan parametreli mesaj çökmez; anahtarı döndürür.
    expect(translate('en', 'home.daysLeft' as MessageKey)).toBe('home.daysLeft');
  });

  it('falls back to the Turkish message when the English catalog lacks an entry', () => {
    const backup = Object.getOwnPropertyDescriptor(en, 'common.save');
    Reflect.deleteProperty(en, 'common.save');
    try {
      expect(translate('en', 'common.save')).toBe('Kaydet');
    } finally {
      if (backup) Object.defineProperty(en, 'common.save', backup);
    }
    expect(translate('en', 'common.save')).toBe('Save');
  });
});

describe('active locale', () => {
  afterEach(() => setActiveLocale('tr'));

  it('defaults to Turkish and switches the global translator', () => {
    expect(getActiveLocale()).toBe('tr');
    expect(t('tabs.tasks')).toBe('Görevler');
    setActiveLocale('en');
    expect(t('tabs.tasks')).toBe('Tasks');
  });

  it('a bound translator keeps its language when the active one changes', () => {
    const turkish = createTranslator('tr');
    const english = createTranslator('en');
    setActiveLocale('en');
    expect(turkish('tabs.home')).toBe('Ana Sayfa');
    expect(english('tabs.home')).toBe('Home');
  });
});

describe('date, time, number and money formats', () => {
  it('formats long dates in both languages from a time-zone-free calendar date', () => {
    expect(formatLong('2026-10-02', 'tr')).toBe('2 Ekim 2026');
    expect(formatLong('2026-10-02', 'en')).toBe('October 2, 2026');
    expect(formatLongWithWeekday('2026-10-02', 'tr')).toBe('2 Ekim 2026 Cuma');
    expect(formatLongWithWeekday('2026-10-02', 'en')).toBe('Friday, October 2, 2026');
    expect(formatLong('2028-02-29', 'en')).toBe('February 29, 2028');
    expect(formatLong('2027-02-29', 'en')).toBe('2027-02-29');
    expect(formatMonthYear('2026-10', 'tr')).toBe('Ekim 2026');
    expect(formatMonthYear('2026-10', 'en')).toBe('October 2026');
    expect(formatMonthYear('bozuk', 'en')).toBe('bozuk');
  });

  it('keeps the stored GG.AA.YYYY form independent of the app language', () => {
    expect(formatNumeric('2026-10-02')).toBe('02.10.2026');
    setActiveLocale('en');
    try {
      expect(formatNumeric('2026-10-02')).toBe('02.10.2026');
    } finally {
      setActiveLocale('tr');
    }
  });

  it('formats times as 24-hour in Turkish and 12-hour in English', () => {
    expect(formatTime('18:30', 'tr')).toBe('18:30');
    expect(formatTime('18:30', 'en')).toBe('6:30 PM');
    expect(formatTime('07:05', 'en')).toBe('7:05 AM');
    expect(formatTime('25:99', 'en')).toBe('25:99');
  });

  it('formats stored timestamps by their local calendar day', () => {
    const stamp = new Date(2027, 2, 28, 23, 59).toISOString();
    expect(formatTimestampDate(stamp, 'tr')).toBe('28.03.2027');
    expect(formatTimestampDate(stamp, 'en')).toBe('3/28/2027');
    expect(formatTimestampDate('bozuk', 'en')).toBe('bozuk');
  });

  it('never shifts a calendar day in either language or time zone', () => {
    const original = process.env.TZ;
    try {
      for (const zone of ['Europe/Istanbul', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Los_Angeles']) {
        process.env.TZ = zone;
        for (const locale of SUPPORTED_LOCALES) {
          expect(formatLong('2027-06-12', locale)).toBe(locale === 'tr' ? '12 Haziran 2027' : 'June 12, 2027');
        }
        const picker = localDateFromIso('2027-06-12');
        expect(picker && isoFromLocalDate(picker)).toBe('2027-06-12');
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it('formats all supported currencies in both languages', () => {
    const turkish = (currency: 'TRY' | 'EUR' | 'USD' | 'GBP') => formatMoney(123456, currency, 'tr-TR');
    const english = (currency: 'TRY' | 'EUR' | 'USD' | 'GBP') => formatMoney(123456, currency, 'en-US');
    expect(turkish('TRY')).toMatch(/1\.234,56/);
    expect(english('TRY')).toMatch(/1,234\.56/);
    expect(english('USD')).toBe('$1,234.56');
    expect(english('EUR')).toBe('€1,234.56');
    expect(english('GBP')).toBe('£1,234.56');
    expect(turkish('EUR')).toMatch(/1\.234,56/);
    expect(turkish('USD')).toMatch(/1\.234,56/);
    expect(turkish('GBP')).toMatch(/1\.234,56/);
  });

  it('defaults money formatting to the active language', () => {
    setActiveLocale('en');
    try {
      expect(formatMoney(123456, 'USD')).toBe('$1,234.56');
    } finally {
      setActiveLocale('tr');
    }
    expect(formatMoney(123456, 'TRY')).toMatch(/1\.234,56/);
  });
});
