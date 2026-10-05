import { fireEvent, render } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import { THEME_IDS, getTheme, type ThemeId } from '@/constants/themes';
import { AppThemeProvider } from '@/context/theme-context';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type AppData } from '@/domain/models';
import { setActiveLocale } from '@/i18n';

const now = '2026-10-02T10:00:00.000Z';
/** Bugünden `days` gün sonrası, YEREL takvim tarihi olarak (uygulama günleri yerel saate göre sayar). */
const localDatePlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};
const future = localDatePlus(100);
const soon = localDatePlus(10);
const baseData: AppData = {
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
  tasks: [
    {
      id: 't1',
      category: 'Venue',
      title: 'Salonu gez',
      description: '',
      dueDate: soon,
      priority: 'high',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't2',
      category: 'Music',
      title: 'Orkestra',
      description: '',
      dueDate: '',
      priority: 'low',
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
  budgetItems: [
    {
      id: 'b1',
      category: 'Venue',
      title: 'Salon kaparo',
      plannedCents: 100_000,
      actualCents: 1_200_000,
      paidCents: 50_000,
      dueDate: soon,
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ],
};

let mockData: AppData = baseData;
const mockStore = new Map<string, string>();
const mockPush = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({ data: mockData, loading: false, refresh: jest.fn() }),
}));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
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

const renderHome = (id: ThemeId) => {
  mockStore.set('dugun-planim.theme', id);
  return render(
    <AppThemeProvider>
      <HomeScreen />
    </AppThemeProvider>,
  );
};

beforeEach(() => {
  mockData = baseData;
  mockStore.clear();
  mockPush.mockClear();
  setActiveLocale('tr');
});
afterAll(() => setActiveLocale('tr'));

describe.each(THEME_IDS)('home screen in %s', (id) => {
  const theme = getTheme(id);

  it('keeps every piece of existing home content (Turkish)', async () => {
    const view = await renderHome(id);
    expect(view.getByText('Ada & Deniz')).toBeTruthy();
    expect(view.getByLabelText('Düğününüze 100 gün kaldı')).toBeTruthy();
    expect(view.getByText('Düğüne kalan')).toBeTruthy();
    expect(view.getByText('Hazırlık ilerlemesi')).toBeTruthy();
    expect(view.getByText('%50')).toBeTruthy();
    const progress = view.getByLabelText('Görev ilerlemesi');
    expect(progress.props.accessibilityRole).toBe('progressbar');
    expect(progress.props.accessibilityValue).toMatchObject({ min: 0, max: 100, now: 50 });
    for (const label of ['Toplam bütçe', 'Harcanan', 'Kalan', 'Davetli yanıtları'])
      expect(view.getByText(label)).toBeTruthy();
    expect(view.getAllByText('Bütçenin üzerinde').length).toBeGreaterThanOrEqual(1);
    expect(view.getByText('Hızlı işlemler')).toBeTruthy();
    for (const label of ['Görev ekle', 'Davetli ekle', 'Harcama ekle'])
      expect(view.getByLabelText(label).props.accessibilityRole).toBe('button');
    expect(view.getByText('Kendi davetiyeni yükle')).toBeTruthy();
    expect(view.getByLabelText(/Kendi davetiyeni yükle\. Cihazdan/)).toBeTruthy();
    expect(view.getByText('Yaklaşanlar')).toBeTruthy();
    expect(view.getByLabelText('Salonu gez')).toBeTruthy();
    expect(view.getByLabelText('Salon kaparo')).toBeTruthy();
  });

  it('renders the English content', async () => {
    setActiveLocale('en');
    const view = await renderHome(id);
    expect(view.getByLabelText('100 days until your wedding')).toBeTruthy();
    for (const label of ['Add task', 'Add guest', 'Add expense']) expect(view.getByLabelText(label)).toBeTruthy();
    expect(view.getByText('Upload your own invitation')).toBeTruthy();
    expect(view.getAllByText('Over budget').length).toBeGreaterThanOrEqual(1);
    expect(view.queryByText('Düğüne kalan')).toBeNull();
  });

  it('uses the layout variants of the theme', async () => {
    const view = await renderHome(id);
    expect(view.getByTestId(`home-hero-${theme.layout.hero}`)).toBeTruthy();
    expect(view.getByTestId(`home-metrics-${theme.layout.metrics}`)).toBeTruthy();
    expect(view.getByTestId(`home-quick-${theme.layout.quick}`)).toBeTruthy();
  });

  it('navigates from the quick actions and the personal invitation card', async () => {
    const view = await renderHome(id);
    await fireEvent.press(view.getByLabelText('Görev ekle'));
    expect(mockPush).toHaveBeenCalledWith('/edit/task');
    await fireEvent.press(view.getByLabelText('Davetli ekle'));
    expect(mockPush).toHaveBeenCalledWith('/edit/guest');
    await fireEvent.press(view.getByLabelText('Harcama ekle'));
    expect(mockPush).toHaveBeenCalledWith('/edit/budget');
    await fireEvent.press(view.getByLabelText(/Kendi davetiyeni yükle\. Cihazdan/));
    expect(mockPush).toHaveBeenCalledWith('/personal-invitation');
  });

  it('hides decoration from screen readers', async () => {
    const view = await renderHome(id);
    expect(view.queryAllByRole('image')).toHaveLength(0);
    // Hero metni tek bir okunabilir öğedir; dekoratif motifler ve fotoğraf alanı gizlidir.
    expect(view.getAllByLabelText('Düğününüze 100 gün kaldı')).toHaveLength(1);
  });
});

describe('the six home screens are genuinely different', () => {
  it('renders six different hero, metric and quick-action compositions', async () => {
    const seen = { hero: new Set<string>(), metrics: new Set<string>(), quick: new Set<string>() };
    for (const id of THEME_IDS) {
      const view = await renderHome(id);
      seen.hero.add(
        view.getByTestId(/^home-hero-(arch-photo|tile-banner|monogram|sunset-arc|starry|meadow)$/).props.testID,
      );
      seen.metrics.add(view.getByTestId(/^home-metrics-/).props.testID);
      seen.quick.add(view.getByTestId(/^home-quick-/).props.testID);
      await view.unmount();
    }
    expect(seen.hero.size).toBe(6);
    expect(seen.metrics.size).toBe(3);
    expect(seen.quick.size).toBe(3);
  });

  it('shows the empty states without crashing in every theme', async () => {
    mockData = { ...EMPTY_APP_DATA, profile: { ...baseData.profile, weddingDate: '' } };
    for (const id of THEME_IDS) {
      const view = await renderHome(id);
      expect(view.getByText('Tarih belirlenmedi')).toBeTruthy();
      expect(view.getByText('Yaklaşan iş yok')).toBeTruthy();
      await view.unmount();
    }
  });
});
