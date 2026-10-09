import { Alert, Appearance, Text, type AlertButton } from 'react-native';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

import IndexGate from '@/app/index';
import SettingsScreen from '@/app/settings';
import StyleSelectScreen from '@/app/style-select';
import TabsLayout from '@/app/(tabs)/_layout';
import { THEME_COPY } from '@/components/theme/theme-copy';
import { THEME_IDS, type ThemeId } from '@/constants/themes';
import { AppThemeProvider, useAppTheme, useThemeControls } from '@/context/theme-context';
import { createBackup, parseBackup } from '@/domain/backup';
import { EMPTY_APP_DATA, EMPTY_PROFILE } from '@/domain/models';
import { createTranslator, setActiveLocale } from '@/i18n';
import { clearThemeId, loadThemeId, saveThemeId } from '@/services/theme-storage';

const TR = createTranslator('tr');
const EN = createTranslator('en');

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
    removeItemSync: (key: string) => {
      if (mockStoreBroken) throw new Error('depo yok');
      return mockStore.delete(key);
    },
  },
}));
jest.mock('expo-localization', () => ({
  useLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }],
  getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }],
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  canDismiss: jest.fn(() => true),
  dismissAll: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};
let mockSearchParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const { Text: RNText } = require('react-native');
  return {
    router: {
      push: (...args: unknown[]) => mockRouter.push(...args),
      replace: (...args: unknown[]) => mockRouter.replace(...args),
      canDismiss: () => mockRouter.canDismiss(),
      canGoBack: () => mockRouter.canGoBack(),
      back: () => mockRouter.back(),
      dismissAll: () => mockRouter.dismissAll(),
    },
    useLocalSearchParams: () => mockSearchParams,
    Redirect: ({ href }: { href: string }) => <RNText testID="redirect">{href}</RNText>,
    Tabs: Object.assign(() => <RNText testID="tabs">tabs</RNText>, { Screen: () => null }),
  };
});

let mockOnboardingCompleted = false;
const mockClearAll = jest.fn().mockResolvedValue({ leftovers: [] });
const mockReplaceAll = jest.fn().mockResolvedValue(undefined);
const mockSaveProfile = jest.fn();
const mockCompleteOnboarding = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: {
      ...jest.requireActual('@/domain/models').EMPTY_APP_DATA,
      profile: {
        ...jest.requireActual('@/domain/models').EMPTY_PROFILE,
        couple1Name: 'Ada',
        couple2Name: 'Deniz',
        onboardingCompleted: mockOnboardingCompleted,
      },
    },
    saveProfile: mockSaveProfile,
    replaceAll: mockReplaceAll,
    clearAll: mockClearAll,
    completeOnboarding: mockCompleteOnboarding,
  }),
}));
const mockPickText = jest.fn();
jest.mock('@/services/export', () => ({
  shareTextFile: jest.fn(),
  pickTextFile: (...a: unknown[]) => mockPickText(...a),
}));
jest.mock('@/services/notifications', () => ({ requestNotificationConsent: jest.fn() }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supportEmail: 'a@b.co' } } },
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

function Probe() {
  const theme = useAppTheme();
  const controls = useThemeControls();
  return <Text testID="probe">{`${theme.id}|${controls.hasChosen ? 'chosen' : 'none'}`}</Text>;
}
const withTheme = (ui: React.ReactElement) => (
  <AppThemeProvider>
    <Probe />
    {ui}
  </AppThemeProvider>
);
const validProfile = {
  ...EMPTY_PROFILE,
  couple1Name: 'Ada',
  couple2Name: 'Deniz',
  weddingDate: '2027-06-12',
  estimatedBudgetCents: 100,
  estimatedGuestCount: 2,
  onboardingCompleted: true,
};
const probeText = (view: { getByTestId: (id: string) => { children: unknown[] } }) =>
  String(view.getByTestId('probe').children.join(''));

beforeEach(() => {
  mockStore.clear();
  mockStoreBroken = false;
  mockOnboardingCompleted = false;
  jest.clearAllMocks();
  mockSearchParams = {};
  setActiveLocale('tr');
});
afterAll(() => setActiveLocale('tr'));

describe('theme storage and provider', () => {
  it('has no theme before the user picks one, and ignores invalid stored values', () => {
    expect(loadThemeId()).toBeNull();
    mockStore.set('dugun-planim.theme', 'dark');
    expect(loadThemeId()).toBeNull();
    mockStore.set('dugun-planim.theme', 'modern-elegance');
    expect(loadThemeId()).toBe('modern-elegance');
  });

  it('falls back safely when the key-value store is unavailable', () => {
    mockStoreBroken = true;
    expect(loadThemeId()).toBeNull();
    expect(saveThemeId('bohemian-sunset')).toBe(false);
    expect(clearThemeId()).toBe(false);
  });

  it('starts unchosen with the default theme, applies a choice instantly and persists it', async () => {
    const first = await renderHook(() => ({ theme: useAppTheme(), controls: useThemeControls() }), {
      wrapper: AppThemeProvider,
    });
    expect(first.result.current.controls.hasChosen).toBe(false);
    expect(first.result.current.theme.id).toBe('romantic-garden');
    await act(async () => first.result.current.controls.setThemeId('midnight-glamour'));
    expect(first.result.current.controls.hasChosen).toBe(true);
    expect(first.result.current.theme.id).toBe('midnight-glamour');
    expect(first.result.current.theme.dark).toBe(true);
    expect(mockStore.get('dugun-planim.theme')).toBe('midnight-glamour');
    await first.unmount();

    // Uygulama kapatılıp yeniden açıldı: yeni sağlayıcı kayıtlı tarzı okur.
    const reopened = await renderHook(() => ({ theme: useAppTheme(), controls: useThemeControls() }), {
      wrapper: AppThemeProvider,
    });
    expect(reopened.result.current.controls.hasChosen).toBe(true);
    expect(reopened.result.current.theme.id).toBe('midnight-glamour');
  });

  it('reset forgets the stored theme', async () => {
    mockStore.set('dugun-planim.theme', 'bohemian-sunset');
    const view = await renderHook(() => useThemeControls(), { wrapper: AppThemeProvider });
    expect(view.result.current.themeId).toBe('bohemian-sunset');
    await act(async () => view.result.current.resetTheme());
    expect(view.result.current.hasChosen).toBe(false);
    expect(mockStore.has('dugun-planim.theme')).toBe(false);
  });
});

describe('"Tarzını seç" screen', () => {
  it('opens with six options in Turkish and cannot continue without a choice', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    expect(view.getByText('Tarzını seç')).toBeTruthy();
    expect(view.getByText('Devam etmek için bir tarz seçin')).toBeTruthy();
    expect(view.getAllByRole('radio')).toHaveLength(6);
    for (const id of THEME_IDS) {
      expect(view.getByLabelText(TR(THEME_COPY[id].name))).toBeTruthy();
      expect(view.getByText(TR(THEME_COPY[id].description))).toBeTruthy();
    }
    const cta = view.getByLabelText('Bu tarzla devam et');
    expect(cta.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(cta);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockStore.has('dugun-planim.theme')).toBe(false);
    expect(probeText(view)).toBe('romantic-garden|none');
  }, 15000);

  it('shows English names and the English button when English is active', async () => {
    setActiveLocale('en');
    const view = await render(withTheme(<StyleSelectScreen />));
    expect(view.getByText('Choose your style')).toBeTruthy();
    expect(view.getByLabelText('Continue with this style')).toBeTruthy();
    for (const id of THEME_IDS) expect(view.getByLabelText(EN(THEME_COPY[id].name))).toBeTruthy();
    expect(view.queryByText('Tarzını seç')).toBeNull();
  });

  it('marks the selection with text and state, not only colour, and saves nothing until continuing', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Kır Çiçekleri'));
    const selected = view.getByLabelText('Kır Çiçekleri. Seçili');
    expect(selected.props.accessibilityState).toMatchObject({ checked: true });
    expect(view.getByText(/✓ Seçili/)).toBeTruthy();
    expect(view.getByLabelText('Bu tarzla devam et').props.accessibilityState).toMatchObject({ disabled: false });
    expect(mockStore.has('dugun-planim.theme')).toBe(false);
    await fireEvent.press(view.getByLabelText('Akdeniz Rüyası'));
    expect(view.queryByLabelText('Kır Çiçekleri. Seçili')).toBeNull();
    expect(view.getAllByText(/✓ Seçili/)).toHaveLength(1);
  });

  it('saves the choice and sends a user without onboarding to onboarding', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Modern Zarafet'));
    await fireEvent.press(view.getByLabelText('Bu tarzla devam et'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/onboarding'));
    expect(mockStore.get('dugun-planim.theme')).toBe('modern-elegance');
    expect(probeText(view)).toBe('modern-elegance|chosen');
    // Düğün verilerine ve onboarding durumuna dokunulmaz.
    expect(mockSaveProfile).not.toHaveBeenCalled();
    expect(mockReplaceAll).not.toHaveBeenCalled();
    expect(mockClearAll).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });

  it('sends an existing user with completed onboarding straight to the home tabs', async () => {
    mockOnboardingCompleted = true;
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Bohem Gün Batımı'));
    await fireEvent.press(view.getByLabelText('Bu tarzla devam et'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
    expect(mockSaveProfile).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });
});

describe('changing the theme from the home screen (?mode=change)', () => {
  beforeEach(() => {
    mockSearchParams = { mode: 'change' };
    mockStore.set('dugun-planim.theme', 'bohemian-sunset');
    mockOnboardingCompleted = true;
  });
  const noDataTouched = () => {
    expect(mockSaveProfile).not.toHaveBeenCalled();
    expect(mockReplaceAll).not.toHaveBeenCalled();
    expect(mockClearAll).not.toHaveBeenCalled();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  };

  it('opens with the current theme already selected and an apply button, not the first-run hint', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    expect(view.getAllByRole('radio')).toHaveLength(6);
    expect(view.getByLabelText('Bohem Gün Batımı. Seçili').props.accessibilityState).toMatchObject({ checked: true });
    expect(view.getByText(/✓ Seçili/)).toBeTruthy();
    const apply = view.getByLabelText('Bu tarzı uygula');
    expect(apply.props.accessibilityState).toMatchObject({ disabled: false });
    expect(view.queryByText('Devam etmek için bir tarz seçin')).toBeNull();
    expect(view.getByText(/Düğün bilgileriniz ve verileriniz değişmez/)).toBeTruthy();
    expect(view.getByLabelText('Vazgeç')).toBeTruthy();
  });

  it('applies the new theme instantly, saves it, returns to the previous screen and touches no data', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Gece Işıltısı'));
    // Henüz uygulanmadı: onaylanana kadar kayıtlı tarz değişmez.
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
    await fireEvent.press(view.getByLabelText('Bu tarzı uygula'));
    expect(mockStore.get('dugun-planim.theme')).toBe('midnight-glamour');
    expect(probeText(view)).toBe('midnight-glamour|chosen');
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    // Onboarding'e veya başka bir ekrana yönlendirme yok.
    expect(mockRouter.replace).not.toHaveBeenCalled();
    noDataTouched();
  });

  it('keeps the same theme and just returns when nothing was changed', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Bu tarzı uygula'));
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    noDataTouched();
  });

  it('cancel returns without changing the stored theme', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Kır Çiçekleri'));
    await fireEvent.press(view.getByLabelText('Vazgeç'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
    expect(probeText(view)).toBe('bohemian-sunset|chosen');
    noDataTouched();
  });

  it('falls back to the home tabs when there is no screen to go back to', async () => {
    mockRouter.canGoBack.mockReturnValueOnce(false);
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Modern Zarafet'));
    await fireEvent.press(view.getByLabelText('Bu tarzı uygula'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockStore.get('dugun-planim.theme')).toBe('modern-elegance');
  });

  it('persists the change for the next launch', async () => {
    const view = await render(withTheme(<StyleSelectScreen />));
    await fireEvent.press(view.getByLabelText('Akdeniz Rüyası'));
    await fireEvent.press(view.getByLabelText('Bu tarzı uygula'));
    await view.unmount();
    mockSearchParams = {};
    const reopened = await render(withTheme(<Text>x</Text>));
    expect(probeText(reopened)).toBe('mediterranean-dream|chosen');
  });

  it('speaks English too', async () => {
    setActiveLocale('en');
    const view = await render(withTheme(<StyleSelectScreen />));
    expect(view.getByLabelText('Apply this style')).toBeTruthy();
    expect(view.getByLabelText('Cancel')).toBeTruthy();
    expect(view.getByText(/Your wedding details and data stay unchanged/)).toBeTruthy();
    expect(view.getByLabelText('Bohemian Sunset. Selected')).toBeTruthy();
  });

  it('first-run mode is unchanged: nothing is preselected and there is no cancel button', async () => {
    mockSearchParams = {};
    mockStore.clear();
    const view = await render(withTheme(<StyleSelectScreen />));
    expect(view.queryByText(/✓ Seçili/)).toBeNull();
    expect(view.getByLabelText('Bu tarzla devam et').props.accessibilityState).toMatchObject({ disabled: true });
    expect(view.queryByLabelText('Vazgeç')).toBeNull();
    expect(view.queryByLabelText('Bu tarzı uygula')).toBeNull();
  });
});

describe('launch gate', () => {
  it.each([
    [false, false, '/style-select'],
    [false, true, '/style-select'],
    [true, false, '/onboarding'],
    [true, true, '/(tabs)'],
  ])('stored=%s onboarded=%s → %s', async (stored, onboarded, href) => {
    if (stored) mockStore.set('dugun-planim.theme', 'romantic-garden');
    mockOnboardingCompleted = onboarded;
    const view = await render(
      <AppThemeProvider>
        <IndexGate />
      </AppThemeProvider>,
    );
    expect(view.getByTestId('redirect').children.join('')).toBe(href);
  });

  it('keeps the tab bar closed until a style is chosen', async () => {
    const closed = await render(
      <AppThemeProvider>
        <TabsLayout />
      </AppThemeProvider>,
    );
    expect(closed.getByTestId('redirect').children.join('')).toBe('/style-select');
    await closed.unmount();
    mockStore.set('dugun-planim.theme', 'wildflower-meadow');
    const open = await render(
      <AppThemeProvider>
        <TabsLayout />
      </AppThemeProvider>,
    );
    expect(open.queryByTestId('redirect')).toBeNull();
    expect(open.getByTestId('tabs')).toBeTruthy();
  });
});

describe('Settings › Appearance', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockStore.set('dugun-planim.theme', 'romantic-garden');
    mockOnboardingCompleted = true;
  });
  afterEach(() => alert.mockRestore());
  const lastButtons = () => (alert.mock.calls[alert.mock.calls.length - 1] as [string, string, AlertButton[]])[2];

  it('lists all six styles in Turkish and English section names', async () => {
    const view = await render(withTheme(<SettingsScreen />));
    expect(view.getByText('Görünüm')).toBeTruthy();
    for (const id of THEME_IDS)
      expect(
        view.getByLabelText(id === 'romantic-garden' ? 'Romantik Bahçe. Seçili' : TR(THEME_COPY[id].name)),
      ).toBeTruthy();
    expect(view.getByText('Geçerli tarz: Romantik Bahçe')).toBeTruthy();
    await view.unmount();

    setActiveLocale('en');
    const en = await render(withTheme(<SettingsScreen />));
    expect(en.getByText('Appearance')).toBeTruthy();
    expect(en.getByText('Current style: Romantic Garden')).toBeTruthy();
    expect(en.getByLabelText('Midnight Glamour')).toBeTruthy();
  });

  it('changes the style instantly without a save button and keeps it after reopening', async () => {
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText('Gece Işıltısı'));
    expect(probeText(view)).toBe('midnight-glamour|chosen');
    expect(view.getByLabelText('Gece Işıltısı. Seçili').props.accessibilityState).toMatchObject({ checked: true });
    expect(view.getByText('Geçerli tarz: Gece Işıltısı')).toBeTruthy();
    expect(mockStore.get('dugun-planim.theme')).toBe('midnight-glamour');
    expect(mockSaveProfile).not.toHaveBeenCalled();
    await view.unmount();

    const reopened = await render(withTheme(<SettingsScreen />));
    expect(probeText(reopened)).toBe('midnight-glamour|chosen');
    expect(reopened.getByLabelText('Gece Işıltısı. Seçili')).toBeTruthy();
  });

  it('keeps the chosen style when a backup is restored', async () => {
    mockStore.set('dugun-planim.theme', 'bohemian-sunset');
    const view = await render(withTheme(<SettingsScreen />));
    mockPickText.mockResolvedValueOnce(createBackup({ ...EMPTY_APP_DATA, profile: validProfile }));
    await fireEvent.press(view.getByLabelText(/^Yedekten geri yükle/));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    await lastButtons()
      .find((b) => b.text === 'Geri yükle')
      ?.onPress?.();
    await waitFor(() => expect(mockReplaceAll).toHaveBeenCalled());
    expect(probeText(view)).toBe('bohemian-sunset|chosen');
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
  });

  it('forgets the style only when all data is deleted, and restarts the first-run flow', async () => {
    mockStore.set('dugun-planim.theme', 'modern-elegance');
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(new RegExp('^' + TR('settings.deleteAll'))));
    await lastButtons()
      .find((b) => b.text === TR('settings.deleteContinue'))
      ?.onPress?.();
    expect(mockClearAll).not.toHaveBeenCalled();
    await act(async () => {
      await lastButtons()
        .find((b) => b.text === TR('settings.deleteEverything'))
        ?.onPress?.();
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/style-select'));
    // Tek yönlendirme: yığın başa alınır, tek bir replace yapılır; eski '/' yönlendirmesi artık yok.
    expect(mockRouter.dismissAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalledWith('/');
    expect(mockClearAll).toHaveBeenCalled();
    expect(mockStore.has('dugun-planim.theme')).toBe(false);
    expect(probeText(view)).toBe('romantic-garden|none');
  });
});

describe('Settings › delete-all edge cases', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockStore.set('dugun-planim.theme', 'bohemian-sunset');
    mockOnboardingCompleted = true;
  });
  afterEach(() => alert.mockRestore());
  const buttons = () => (alert.mock.calls[alert.mock.calls.length - 1] as [string, string, AlertButton[]])[2];

  async function runDeleteAll() {
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(new RegExp('^' + TR('settings.deleteAll'))));
    await buttons()
      .find((b) => b.text === TR('settings.deleteContinue'))
      ?.onPress?.();
    await act(async () => {
      await buttons()
        .find((b) => b.text === TR('settings.deleteEverything'))
        ?.onPress?.();
    });
    return view;
  }

  it('keeps the style and tells the user when deleting the data fails', async () => {
    mockClearAll.mockRejectedValueOnce(new Error('disk dolu'));
    const view = await runDeleteAll();
    await waitFor(() => expect(alert).toHaveBeenLastCalledWith(TR('settings.deleteFailed'), 'disk dolu'));
    expect(mockStore.get('dugun-planim.theme')).toBe('bohemian-sunset');
    expect(probeText(view)).toBe('bohemian-sunset|chosen');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('does not try to dismiss when there is nothing to dismiss', async () => {
    mockRouter.canDismiss.mockReturnValueOnce(false);
    await runDeleteAll();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/style-select'));
    expect(mockRouter.dismissAll).not.toHaveBeenCalled();
  });
});

describe('native appearance follows the chosen theme', () => {
  it('forces a light native scheme for light themes and a dark one for Midnight Glamour', async () => {
    const spy = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
    mockStore.set('dugun-planim.theme', 'wildflower-meadow');
    const view = await render(withTheme(<Text>x</Text>));
    expect(spy).toHaveBeenLastCalledWith('light');
    await view.unmount();
    mockStore.set('dugun-planim.theme', 'midnight-glamour');
    await render(withTheme(<Text>x</Text>));
    expect(spy).toHaveBeenLastCalledWith('dark');
    spy.mockRestore();
  });

  it('does not crash when the native scheme cannot be set', async () => {
    const spy = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {
      throw new Error('desteklenmiyor');
    });
    await expect(render(withTheme(<Text>x</Text>))).resolves.toBeTruthy();
    spy.mockRestore();
  });
});

describe('Settings › delete-all and restore tell the truth about what happened', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockStore.set('dugun-planim.theme', 'modern-elegance');
    mockOnboardingCompleted = true;
  });
  afterEach(() => alert.mockRestore());
  const last = () => alert.mock.calls[alert.mock.calls.length - 1] as [string, string, AlertButton[]];
  const press = async (text: string) => {
    await act(async () => {
      await last()[2]
        .find((button) => button.text === text)
        ?.onPress?.();
    });
  };
  async function startDeleteAll() {
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(new RegExp('^' + TR('settings.deleteAll'))));
    // İlk onay: açıklama gerçek davranışı anlatır.
    expect(last()[1]).toBe(TR('settings.deleteBody'));
    await press(TR('settings.deleteContinue'));
    await press(TR('settings.deleteEverything'));
    return view;
  }

  it('the first confirmation lists everything that is deleted and what stays where the user saved it', async () => {
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(new RegExp('^' + TR('settings.deleteAll'))));
    const body = last()[1];
    for (const phrase of [
      'davetiye görselleri ve fotoğrafları',
      'planlı hatırlatmalar',
      'geçici dışa aktarma dosyaları',
      'görsel tarz',
      'seçtiğiniz konumda kalır',
    ])
      expect(body).toContain(phrase);
    setActiveLocale('en');
    await view.unmount();
    const en = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(en.getByLabelText(new RegExp('^' + EN('settings.deleteAll'))));
    expect(last()[1]).toContain('scheduled reminders');
    expect(last()[1]).toContain('stay where you saved them');
  });

  it('shows the leftovers that could not be removed, keeps the screen, and lets the user retry', async () => {
    mockClearAll.mockResolvedValueOnce({ leftovers: ['reminders', 'exportFiles'] });
    const view = await startDeleteAll();
    const [title, message, buttons] = last();
    expect(title).toBe(TR('settings.deletePartialTitle'));
    expect(message).toContain('Düğün verileriniz silindi');
    expect(message).toContain('planlı hatırlatmalar ve dışa aktarma dosyaları');
    expect(buttons.map((button) => button.text)).toEqual([TR('settings.deleteRetry'), TR('settings.deleteLater')]);
    // Android'de dışarı dokunmakla kapanmaz: kullanıcı bilinçli seçer.
    expect(alert.mock.calls[alert.mock.calls.length - 1][3]).toEqual({ cancelable: false });
    // Veritabanı boşaldığı için tema kaydı hemen silindi (uyarı açıkken uygulama kapansa bile ilk kurulum akışı başlar);
    // ekran durumu yönlendirme sırasında sıfırlanır.
    expect(mockStore.has('dugun-planim.theme')).toBe(false);
    // Henüz ilk kurulum akışına dönülmez; tema korunur.
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(probeText(view)).toBe('modern-elegance|chosen');
    // Tekrar dene: temizlik yeniden çalışır ve bu sefer tamamlanır.
    await press(TR('settings.deleteRetry'));
    expect(mockClearAll).toHaveBeenCalledTimes(2);
    expect(mockRouter.replace).toHaveBeenCalledWith('/style-select');
    expect(probeText(view)).toBe('romantic-garden|none');
  });

  it('"Tamam" accepts the leftovers: the data is gone, so the first-run flow starts', async () => {
    mockClearAll.mockResolvedValueOnce({ leftovers: ['invitationPhotos'] });
    const view = await startDeleteAll();
    expect(last()[1]).toContain('davetiye fotoğrafları');
    await press(TR('settings.deleteLater'));
    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/style-select');
    expect(probeText(view)).toBe('romantic-garden|none');
  });

  it('says nothing is deleted when the database could not be cleared, and keeps the theme', async () => {
    mockClearAll.mockRejectedValueOnce(new Error('veritabanı kilitli'));
    const view = await startDeleteAll();
    expect(last().slice(0, 2)).toEqual([TR('settings.deleteFailed'), 'veritabanı kilitli']);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockStore.get('dugun-planim.theme')).toBe('modern-elegance');
    expect(probeText(view)).toBe('modern-elegance|chosen');
  });

  it('tells the user when restored reminders are off because this device has no notification permission', async () => {
    mockReplaceAll.mockResolvedValueOnce({
      notificationsEnabled: false,
      notificationsDowngraded: true,
      remindersRestored: 0,
      remindersSkipped: 2,
    });
    mockPickText.mockResolvedValueOnce(createBackup({ ...EMPTY_APP_DATA, profile: validProfile }));
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(/^Yedekten geri yükle/));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    await press('Geri yükle');
    await waitFor(() => expect(last()[0]).toBe('Tamamlandı'));
    expect(last()[1]).toContain(TR('backup.restoredNotificationsOff'));
    expect(probeText(view)).toBe('modern-elegance|chosen');
  });

  it('keeps the plain message when nothing changed about reminders', async () => {
    mockReplaceAll.mockResolvedValueOnce({
      notificationsEnabled: true,
      notificationsDowngraded: false,
      remindersRestored: 0,
      remindersSkipped: 0,
    });
    mockPickText.mockResolvedValueOnce(createBackup({ ...EMPTY_APP_DATA, profile: validProfile }));
    const view = await render(withTheme(<SettingsScreen />));
    await fireEvent.press(view.getByLabelText(/^Yedekten geri yükle/));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    await press('Geri yükle');
    await waitFor(() => expect(last()[0]).toBe('Tamamlandı'));
    expect(last()[1]).toBe(TR('backup.restoredPlain'));
  });
});

describe('backup policy for the style preference', () => {
  it('keeps the device-local style out of the JSON backup', () => {
    mockStore.set('dugun-planim.theme', 'midnight-glamour');
    const raw = createBackup({ ...EMPTY_APP_DATA, profile: validProfile });
    for (const id of THEME_IDS as readonly ThemeId[]) expect(raw).not.toContain(id);
    expect(raw).not.toContain('dugun-planim.theme');
    const payload = JSON.parse(raw).payload as Record<string, unknown>;
    expect(Object.keys(payload)).not.toEqual(expect.arrayContaining(['themeId', 'style', 'appearance']));
  });

  it('restoring a backup never reads or writes the stored style', () => {
    mockStore.set('dugun-planim.theme', 'wildflower-meadow');
    const raw = createBackup({ ...EMPTY_APP_DATA, profile: validProfile });
    expect(parseBackup(raw).profile.couple1Name).toBe('Ada');
    expect(mockStore.get('dugun-planim.theme')).toBe('wildflower-meadow');
  });
});
