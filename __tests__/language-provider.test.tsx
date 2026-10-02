import { Text } from 'react-native';
import { act, fireEvent, render, renderHook } from '@testing-library/react-native';

import SettingsScreen from '@/app/settings';
import MoreScreen from '@/app/(tabs)/more';
import { LanguageProvider, useI18n } from '@/context/language-context';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type Guest } from '@/domain/models';
import { validateGuest, ValidationError } from '@/domain/validation';
import { getActiveLocale, setActiveLocale } from '@/i18n';
import { loadLanguagePreference, saveLanguagePreference } from '@/services/language-storage';
import { GUEST_DEFAULTS } from './fixtures';

let mockDevice: { languageCode: string | null; languageTag: string }[] = [{ languageCode: 'tr', languageTag: 'tr-TR' }];
jest.mock('expo-localization', () => ({ useLocales: () => mockDevice, getLocales: () => mockDevice }));

const mockStore = new Map<string, string>();
let mockStoreBroken = false;
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemSync: (key: string) => {
      if (mockStoreBroken) throw new Error('depo yok');
      return mockStore.get(key) ?? null;
    },
    setItemSync: (key: string, value: string) => {
      if (mockStoreBroken) throw new Error('depo yok');
      mockStore.set(key, value);
    },
  },
}));

jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: { ...jest.requireActual('@/domain/models').EMPTY_APP_DATA, profile: mockProfile() },
    saveProfile: jest.fn(),
    replaceAll: jest.fn(),
    clearAll: jest.fn(),
  }),
}));
const mockProfile = () => ({ ...EMPTY_PROFILE, onboardingCompleted: true });
jest.mock('@/services/export', () => ({ shareTextFile: jest.fn(), pickTextFile: jest.fn() }));
jest.mock('@/services/notifications', () => ({ requestNotificationConsent: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supportEmail: 'a@b.co' } } },
}));
jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    dark: false,
    colors: {
      primary: '#6F1D3A',
      muted: '#666',
      warning: '#995500',
      danger: '#a33',
      surface: '#fff',
      surfaceAlt: '#eee',
      text: '#222',
      border: '#ddd',
      primaryText: '#fff',
    },
  }),
}));
jest.mock('@/components/ui/screen', () => {
  const { View } = require('react-native');
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

const KEY = 'dugun-planim.language';
const wrapper = ({ children }: { children: React.ReactNode }) => <LanguageProvider>{children}</LanguageProvider>;
const device = (code: string, tag = code) => [{ languageCode: code, languageTag: tag }];

beforeEach(() => {
  mockStore.clear();
  mockStoreBroken = false;
  mockDevice = device('tr', 'tr-TR');
  setActiveLocale('tr');
});
afterAll(() => setActiveLocale('tr'));

describe('automatic language', () => {
  it.each([
    ['tr', 'tr-TR', 'tr'],
    ['en', 'en-US', 'en'],
    ['en', 'en-GB', 'en'],
    ['de', 'de-DE', 'tr'],
    ['ar', 'ar-SA', 'tr'],
  ])('device language %s (%s) resolves to %s', async (code, tag, expected) => {
    mockDevice = device(code, tag);
    const { result } = await renderHook(() => useI18n(), { wrapper });
    expect(result.current.preference).toBe('auto');
    expect(result.current.locale).toBe(expected);
    expect(getActiveLocale()).toBe(expected);
  });

  it('is the default when nothing was saved', async () => {
    const { result } = await renderHook(() => useI18n(), { wrapper });
    expect(result.current.preference).toBe('auto');
    expect(loadLanguagePreference()).toBe('auto');
  });
});

describe('manual language choice', () => {
  it('Turkish stays Turkish even when the device language is English', async () => {
    mockDevice = device('en', 'en-US');
    mockStore.set(KEY, 'tr');
    const { result } = await renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe('tr');
    expect(result.current.t('tabs.tasks')).toBe('Görevler');
  });

  it('English stays English even when the device language is Turkish', async () => {
    mockDevice = device('tr', 'tr-TR');
    mockStore.set(KEY, 'en');
    const { result } = await renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe('en');
    expect(result.current.t('tabs.tasks')).toBe('Tasks');
  });

  it('updates every consumer immediately, without a restart', async () => {
    function Label() {
      const { t } = useI18n();
      return <Text>{t('tabs.home')}</Text>;
    }
    const { result } = await renderHook(() => useI18n(), {
      wrapper: ({ children }) => (
        <LanguageProvider>
          <Label />
          {children}
        </LanguageProvider>
      ),
    });
    expect(result.current.t('tabs.home')).toBe('Ana Sayfa');
    await act(async () => result.current.setPreference('en'));
    expect(result.current.t('tabs.home')).toBe('Home');
    expect(result.current.locale).toBe('en');
    // Yeni bir bileşen ağacı yeniden kurulmadan alan kodundaki çeviriler de değişir.
    expect(getActiveLocale()).toBe('en');
    await act(async () => result.current.setPreference('tr'));
    expect(result.current.t('tabs.home')).toBe('Ana Sayfa');
  });

  it('the translator identity changes with the language so memoized screens refresh', async () => {
    const { result } = await renderHook(() => useI18n(), { wrapper });
    const before = result.current.t;
    await act(async () => result.current.setPreference('en'));
    expect(result.current.t).not.toBe(before);
  });
});

describe('persistence', () => {
  it('keeps a manual choice after the app is reopened', async () => {
    const first = await renderHook(() => useI18n(), { wrapper });
    await act(async () => first.result.current.setPreference('en'));
    expect(mockStore.get(KEY)).toBe('en');
    await first.unmount();
    setActiveLocale('tr');
    mockDevice = device('tr', 'tr-TR');
    const reopened = await renderHook(() => useI18n(), { wrapper });
    expect(reopened.result.current.preference).toBe('en');
    expect(reopened.result.current.locale).toBe('en');
  });

  it('keeps "automatic" after reopening and keeps following the device', async () => {
    mockStore.set(KEY, 'en');
    const first = await renderHook(() => useI18n(), { wrapper });
    await act(async () => first.result.current.setPreference('auto'));
    expect(mockStore.get(KEY)).toBe('auto');
    await first.unmount();
    mockDevice = device('en', 'en-GB');
    const reopened = await renderHook(() => useI18n(), { wrapper });
    expect(reopened.result.current.preference).toBe('auto');
    expect(reopened.result.current.locale).toBe('en');
    await reopened.unmount();
    mockDevice = device('tr', 'tr-TR');
    const again = await renderHook(() => useI18n(), { wrapper });
    expect(again.result.current.locale).toBe('tr');
  });

  it('ignores corrupt stored values', async () => {
    mockStore.set(KEY, 'klingon');
    expect(loadLanguagePreference()).toBe('auto');
    const { result } = await renderHook(() => useI18n(), { wrapper });
    expect(result.current.preference).toBe('auto');
  });

  it('survives an unavailable store without crashing', async () => {
    mockStoreBroken = true;
    expect(loadLanguagePreference()).toBe('auto');
    expect(saveLanguagePreference('en')).toBe(false);
    const { result } = await renderHook(() => useI18n(), { wrapper });
    await act(async () => result.current.setPreference('en'));
    expect(result.current.locale).toBe('en');
  });

  it('is stored separately from wedding data', () => {
    saveLanguagePreference('en');
    expect([...mockStore.keys()]).toEqual([KEY]);
  });
});

describe('without a provider', () => {
  it('falls back to the active language and never throws', async () => {
    setActiveLocale('en');
    const { result } = await renderHook(() => useI18n());
    expect(result.current.locale).toBe('en');
    expect(result.current.t('common.save')).toBe('Save');
    expect(() => result.current.setPreference('tr')).not.toThrow();
  });
});

describe('domain messages follow the active language', () => {
  const guest: Guest = {
    id: 'g1',
    name: ' ',
    phone: '',
    side: 'common',
    partySize: 1,
    childCount: 0,
    rsvp: 'pending',
    notes: '',
    mealNotes: '',
    group: 'other',
    ...GUEST_DEFAULTS,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  };

  it('validation errors are translated at the time they are raised', async () => {
    expect(() => validateGuest(guest)).toThrow('Davetli adı zorunludur.');
    mockStore.set(KEY, 'en');
    await render(<LanguageProvider>{null}</LanguageProvider>);
    expect(() => validateGuest(guest)).toThrow(new ValidationError('Guest name is required.'));
  });
});

describe('screens', () => {
  it('render in English when English is selected and switch live from Settings', async () => {
    const view = await render(
      <LanguageProvider>
        <SettingsScreen />
      </LanguageProvider>,
    );
    expect(view.getByText('Tüm verilerimi sil')).toBeTruthy();
    expect(view.queryByText('Delete all my data')).toBeNull();
    // Dil seçimi anında uygulanır; Ayarlar ekranı yeniden başlatma olmadan İngilizceye geçer.
    await fireEvent.press(view.getByLabelText('Uygulama dili: English'));
    expect(view.getByText('Delete all my data')).toBeTruthy();
    expect(view.getByText('App language')).toBeTruthy();
    expect(view.getByLabelText('App language: Automatic')).toBeTruthy();
    expect(view.getByText('Currently: English')).toBeTruthy();
    expect(view.queryByText('Tüm verilerimi sil')).toBeNull();
    expect(mockStore.get(KEY)).toBe('en');
    await fireEvent.press(view.getByLabelText('App language: Türkçe'));
    expect(view.getByText('Tüm verilerimi sil')).toBeTruthy();
    expect(mockStore.get(KEY)).toBe('tr');
  });

  it('the language selector offers Automatic, Türkçe and English with Automatic as the default', async () => {
    const view = await render(
      <LanguageProvider>
        <SettingsScreen />
      </LanguageProvider>,
    );
    for (const label of ['Otomatik', 'Türkçe', 'English']) {
      expect(view.getByLabelText(`Uygulama dili: ${label}`)).toBeTruthy();
    }
    expect(view.getByLabelText('Uygulama dili: Otomatik').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('shows English menu text on the More screen', async () => {
    mockStore.set(KEY, 'en');
    const view = await render(
      <LanguageProvider>
        <MoreScreen />
      </LanguageProvider>,
    );
    expect(view.getByText('Seating plan')).toBeTruthy();
    expect(view.getByText('Settings and help')).toBeTruthy();
    expect(view.queryByText('Masa planı')).toBeNull();
  });
});

describe('existing wedding data is untouched by language changes', () => {
  it('keeps user-written text exactly as entered', () => {
    const data = {
      ...EMPTY_APP_DATA,
      profile: { ...EMPTY_PROFILE, couple1Name: 'Ayşe', couple2Name: 'Mehmet', onboardingCompleted: true },
    };
    const before = JSON.stringify(data);
    setActiveLocale('en');
    expect(JSON.stringify(data)).toBe(before);
    expect(data.profile.couple1Name).toBe('Ayşe');
  });
});
