import { Dimensions, Image, StyleSheet, Text } from 'react-native';
import { act, fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import StyleSelectScreen from '@/app/style-select';
import { THEME_IMAGES } from '@/constants/theme-images';
import { THEME_IDS, type ThemeId } from '@/constants/themes';
import { AppThemeProvider, useThemeControls } from '@/context/theme-context';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type AppData } from '@/domain/models';
import { setActiveLocale } from '@/i18n';

/** Bugünden `days` gün sonrası, YEREL takvim tarihi olarak (uygulama günleri yerel saate göre sayar). */
const localDatePlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};
const future = localDatePlus(100);
const mockData: AppData = {
  ...EMPTY_APP_DATA,
  profile: {
    ...EMPTY_PROFILE,
    couple1Name: 'Ada',
    couple2Name: 'Deniz',
    weddingDate: future,
    estimatedBudgetCents: 1_000_000,
    estimatedGuestCount: 80,
    onboardingCompleted: true,
  },
};

const mockStore = new Map<string, string>();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({ data: mockData, loading: false, refresh: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemSync: (key: string) => mockStore.get(key) ?? null,
    setItemSync: (key: string, value: string) => mockStore.set(key, value),
    removeItemSync: (key: string) => mockStore.delete(key),
  },
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

const uriOf = (source: unknown) => (source as { testUri: string }).testUri;
const heroImages = () => screen.queryAllByTestId(/^home-hero-image-/, { includeHiddenElements: true });
const thumbs = () => screen.queryAllByTestId(/^style-thumb-/, { includeHiddenElements: true });

function SwitchTheme({ to }: { to: ThemeId }) {
  const { setThemeId } = useThemeControls();
  return (
    <Text accessibilityRole="button" onPress={() => setThemeId(to)}>
      switch
    </Text>
  );
}

beforeEach(() => {
  mockStore.clear();
  setActiveLocale('tr');
  Dimensions.set({ window: { width: 430, height: 932, scale: 3, fontScale: 1 } });
});
afterAll(() => setActiveLocale('tr'));

describe('home hero photo', () => {
  const renderHome = (id: ThemeId, extra?: React.ReactNode) => {
    mockStore.set('dugun-planim.theme', id);
    return render(
      <AppThemeProvider>
        {extra}
        <HomeScreen />
      </AppThemeProvider>,
    );
  };

  it.each(THEME_IDS)('%s shows its own hero image and no placeholder', async (id) => {
    await renderHome(id);
    const images = heroImages();
    expect(images).toHaveLength(1);
    expect(images[0].props.testID).toBe(`home-hero-image-${id}`);
    expect(uriOf(images[0].props.source)).toBe(uriOf(THEME_IMAGES[id].hero));
    expect(images[0].props.resizeMode).toBe('cover');
    // Eski kodla çizilmiş fotoğraf yer tutucusu (monogram baş harfleri) artık yok.
    expect(screen.queryByText('A & D')).toBeNull();
  });

  it('renders only the active theme image, never all six at once', async () => {
    await renderHome('midnight-glamour');
    expect(heroImages()).toHaveLength(1);
    expect(thumbs()).toHaveLength(0);
  });

  it('swaps the hero image when the theme changes', async () => {
    await renderHome('romantic-garden', <SwitchTheme to="wildflower-meadow" />);
    expect(heroImages()[0].props.testID).toBe('home-hero-image-romantic-garden');
    await fireEvent.press(screen.getByText('switch'));
    expect(heroImages()).toHaveLength(1);
    expect(heroImages()[0].props.testID).toBe('home-hero-image-wildflower-meadow');
    expect(uriOf(heroImages()[0].props.source)).toBe(uriOf(THEME_IMAGES['wildflower-meadow'].hero));
  });

  it.each(['tr', 'en'] as const)(
    'keeps names, countdown and date as real text independent of the photo (%s)',
    async (lang) => {
      setActiveLocale(lang);
      await renderHome('modern-elegance');
      const names = screen.getByText('Ada & Deniz');
      expect(names.props.accessibilityRole).toBe('header');
      expect(isHiddenFromAccessibility(names)).toBe(false);
      const countdown = screen.getByLabelText(
        lang === 'tr' ? 'Düğününüze 100 gün kaldı' : '100 days until your wedding',
      );
      expect(isHiddenFromAccessibility(countdown)).toBe(false);
      expect(screen.getByText(lang === 'tr' ? 'Düğüne kalan' : 'Time until the wedding')).toBeTruthy();
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeTruthy();
      // Görselin kendisi ekran okuyucudan gizlidir ve metin görsele gömülü değildir.
      expect(isHiddenFromAccessibility(heroImages()[0])).toBe(true);
      expect(heroImages()[0].props.accessibilityLabel).toBeUndefined();
    },
  );

  it('does not duplicate the couple names outside the hero', async () => {
    await renderHome('bohemian-sunset');
    expect(screen.getAllByText('Ada & Deniz')).toHaveLength(1);
  });

  it('lets the hero grow with large text instead of clipping it', async () => {
    await renderHome('romantic-garden');
    const frame = StyleSheet.flatten(screen.getByTestId('home-hero-frame').props.style);
    expect(frame.height).toBeUndefined();
    expect(frame.minHeight).toBeGreaterThanOrEqual(232);
    for (const text of [screen.getByText('Ada & Deniz'), screen.getByText(/gün$/)]) {
      expect(text.props.numberOfLines).toBeUndefined();
      expect(text.props.maxFontSizeMultiplier).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('sizes the hero for small iPhone and iPad widths without growing unbounded', async () => {
    await renderHome('romantic-garden');
    const frame = screen.getByTestId('home-hero-frame');
    const heightAt = async (width: number) => {
      await act(async () => {
        fireEvent(frame, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height: 300 } } });
      });
      return StyleSheet.flatten(screen.getByTestId('home-hero-frame').props.style).minHeight as number;
    };
    expect(await heightAt(343)).toBe(232); // küçük iPhone: alt sınır
    expect(await heightAt(398)).toBeGreaterThanOrEqual(232);
    expect(await heightAt(640)).toBe(380); // iPad: üst sınır
    expect(await heightAt(900)).toBe(380);
  });

  it('crops around the couple once the hero is measured', async () => {
    await renderHome('midnight-glamour');
    const frameWidth = 343;
    await act(async () => {
      fireEvent(heroImages()[0].parent!, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: frameWidth, height: 232 } },
      });
    });
    const style = StyleSheet.flatten(heroImages()[0].props.style);
    expect(style.position).toBe('absolute');
    expect(style.width).toBeGreaterThanOrEqual(frameWidth);
    expect(style.height).toBeGreaterThanOrEqual(232);
  });
});

describe('"Tarzını seç" thumbnails', () => {
  const widths: [string, number, number][] = [
    ['small iPhone', 375, 165],
    ['large iPhone', 430, 193],
    ['iPad', 820, 338],
  ];

  it('shows the correct thumbnail on each visible card and defers the rest', async () => {
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    const shown = thumbs();
    expect(shown).toHaveLength(4);
    expect(shown.map((image) => image.props.testID)).toEqual(THEME_IDS.slice(0, 4).map((id) => `style-thumb-${id}`));
    for (const image of shown) {
      const id = (image.props.testID as string).replace('style-thumb-', '') as ThemeId;
      expect(uriOf(image.props.source)).toBe(uriOf(THEME_IMAGES[id].thumb));
    }
    // Hero çözünürlüklü görseller seçim ekranında hiç yüklenmez.
    expect(heroImages()).toHaveLength(0);
    const uris = shown.map((image) => uriOf(image.props.source));
    expect(uris.every((uri) => uri.includes('-thumb.jpg'))).toBe(true);
  });

  it('loads the remaining thumbnails only after they approach the viewport', async () => {
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    expect(thumbs()).toHaveLength(4);
    const scroll = screen.getByTestId('style-scroll', { includeHiddenElements: true });
    await act(async () => {
      fireEvent(scroll, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 430, height: 700 } } });
    });
    for (const [index, id] of THEME_IDS.entries()) {
      await act(async () => {
        fireEvent(screen.getByLabelText(new RegExp('^' + THEME_LABEL[id])), 'layout', {
          nativeEvent: { layout: { x: (index % 2) * 200, y: Math.floor(index / 2) * 600, width: 193, height: 400 } },
        });
      });
    }
    // Ölçümden sonra üçüncü satır (y=1200) görünür alandan uzaktır: yalnız ilk dört görsel yüklüdür.
    expect(thumbs()).toHaveLength(4);
    expect(screen.queryByTestId('style-thumb-wildflower-meadow', { includeHiddenElements: true })).toBeNull();
    await act(async () => {
      fireEvent.scroll(scroll, {
        nativeEvent: {
          contentOffset: { x: 0, y: 700 },
          contentSize: { width: 430, height: 1800 },
          layoutMeasurement: { width: 430, height: 700 },
        },
      });
    });
    expect(screen.queryByTestId('style-thumb-wildflower-meadow', { includeHiddenElements: true })).toBeTruthy();
    // İlk satır görünür alandan çıktığı için bırakılır: aynı anda altı görselin hepsi hiçbir zaman yüklü olmaz.
    expect(screen.queryByTestId('style-thumb-romantic-garden', { includeHiddenElements: true })).toBeNull();
    expect(thumbs()).toHaveLength(4);
  });

  it.each(widths)('keeps two readable columns on %s', async (_name, width, expected) => {
    Dimensions.set({ window: { width, height: 800, scale: 2, fontScale: 1 } });
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    const card = StyleSheet.flatten(screen.getByLabelText('Romantik Bahçe').props.style);
    const other = StyleSheet.flatten(screen.getByLabelText('Akdeniz Rüyası').props.style);
    expect(card.width).toBe(expected);
    expect(other.width).toBe(expected);
    // İki sütun sığmalı: iki kart + boşluk + yan boşluklar genişliği aşmaz.
    expect((card.width as number) * 2 + 12 + 32).toBeLessThanOrEqual(Math.min(width, 720));
  });

  it('does not let cards grow on iPad', async () => {
    Dimensions.set({ window: { width: 1194, height: 834, scale: 2, fontScale: 1 } });
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    expect(StyleSheet.flatten(screen.getByLabelText('Romantik Bahçe').props.style).width).toBeLessThanOrEqual(340);
  });

  it('marks the selection with text, state and a visible check, and hides the pictures from screen readers', async () => {
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    await fireEvent.press(screen.getByLabelText('Gece Işıltısı'));
    expect(screen.getByLabelText('Gece Işıltısı. Seçili').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByText(/✓ Seçili/)).toBeTruthy();
    for (const image of thumbs()) expect(isHiddenFromAccessibility(image)).toBe(true);
    // Okuma sırası: başlık, açıklama, kartlar, devam düğmesi.
    const labels = screen.getAllByRole('radio').map((node) => node.props.accessibilityLabel);
    expect(labels[0]).toBe('Romantik Bahçe');
    expect(screen.getByLabelText('Bu tarzla devam et')).toBeTruthy();
  });

  it('shows English card text and the English button', async () => {
    setActiveLocale('en');
    await render(
      <AppThemeProvider>
        <StyleSelectScreen />
      </AppThemeProvider>,
    );
    expect(screen.getByLabelText('Wildflower Meadow')).toBeTruthy();
    expect(screen.getByLabelText('Continue with this style')).toBeTruthy();
    expect(Image).toBeTruthy();
  });
});

const THEME_LABEL: Record<ThemeId, string> = {
  'romantic-garden': 'Romantik Bahçe',
  'mediterranean-dream': 'Akdeniz Rüyası',
  'modern-elegance': 'Modern Zarafet',
  'bohemian-sunset': 'Bohem Gün Batımı',
  'midnight-glamour': 'Gece Işıltısı',
  'wildflower-meadow': 'Kır Çiçekleri',
};
