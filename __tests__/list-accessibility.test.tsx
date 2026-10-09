import { fireEvent, render } from '@testing-library/react-native';

import BudgetScreen from '@/app/(tabs)/budget';
import GuestsScreen from '@/app/(tabs)/guests';
import TasksScreen from '@/app/(tabs)/tasks';
import CalendarScreen from '@/app/calendar';
import NotesScreen from '@/app/notes';
import SettingsScreen from '@/app/settings';
import VendorsScreen from '@/app/vendors';
import { ListRow } from '@/components/ui/list-row';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type AppData } from '@/domain/models';
import { setActiveLocale } from '@/i18n';
import { GUEST_DEFAULTS } from './fixtures';

/**
 * Liste satırları tek bir erişilebilir öğedir: etiketi çocuk metinlerin yerine geçer. Bu testler VoiceOver/TalkBack'in
 * okuyacağı etiketin başlıkla birlikte durum, tutar, tarih gibi anlamlı bilgileri taşıdığını doğrular.
 * (Gerçek ekran okuyucu davranışı cihazda doğrulanmalıdır.)
 */

const now = '2026-10-02T10:00:00.000Z';
const dayMs = 24 * 3600 * 1000;
const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * dayMs).toISOString().slice(0, 10);

const profile = {
  ...EMPTY_PROFILE,
  couple1Name: 'Ece',
  couple2Name: 'Mert',
  weddingDate: '2027-06-12',
  estimatedBudgetCents: 1_000_000,
  estimatedGuestCount: 80,
  onboardingCompleted: true,
  notificationsEnabled: true,
};
const sample: AppData = {
  ...EMPTY_APP_DATA,
  profile,
  tasks: [
    {
      id: 't1',
      category: 'Mekân',
      title: 'Salonu gez',
      description: '',
      dueDate: isoDay(-3),
      priority: 'high',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't2',
      category: 'Müzik',
      title: 'Orkestra ayarla',
      description: '',
      dueDate: '',
      priority: 'low',
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
  guests: [
    {
      id: 'g1',
      name: 'Ayşe Test',
      phone: '',
      side: 'common',
      partySize: 3,
      childCount: 1,
      rsvp: 'attending',
      notes: '',
      mealNotes: '',
      group: 'family',
      ...GUEST_DEFAULTS,
      createdAt: now,
      updatedAt: now,
    },
  ],
  budgetItems: [
    {
      id: 'b1',
      category: 'Mekân',
      title: 'Salon kirası',
      plannedCents: 100_000,
      actualCents: 125_050,
      paidCents: 0,
      dueDate: '2027-02-01',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ],
  vendors: [
    {
      id: 'vd1',
      category: 'Fotoğraf',
      name: 'Stüdyo Bir',
      phone: '',
      email: '',
      quoteCents: 90_000,
      contractStatus: 'quoted',
      paymentPlan: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ],
  notes: [{ id: 'n1', title: 'Fikirler', content: 'Çiçekler\n  ve   masa süsleri', createdAt: now, updatedAt: now }],
};

jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: mockData,
    loading: false,
    createId: () => 'new-id',
    refresh: jest.fn(),
    saveTask: jest.fn(),
    deleteTask: jest.fn(),
    saveGuest: jest.fn(),
    saveProfile: jest.fn(),
    replaceAll: jest.fn(),
    clearAll: jest.fn(),
  }),
}));
let mockData: AppData = sample;
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/context/theme-context', () => {
  const { getTheme } = require('@/constants/themes');
  const theme = getTheme('romantic-garden');
  return {
    useAppTheme: () => theme,
    useThemeControls: () => ({
      hasChosen: true,
      themeId: 'romantic-garden',
      setThemeId: jest.fn(),
      resetTheme: jest.fn(),
    }),
  };
});
jest.mock('@/components/ui/screen', () => {
  const { View } = require('react-native');
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: () => null, setItemSync: jest.fn() },
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0' }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supportEmail: 'a@b.co' } } },
}));
jest.mock('@/services/export', () => ({
  escapeHtml: (value: string) => value,
  pdfDocument: (_title: string, body: string) => body,
  shareHtmlAsPdf: jest.fn(),
  shareTextFile: jest.fn(),
  pickTextFile: jest.fn(),
}));
jest.mock('@/services/notifications', () => ({ requestNotificationConsent: jest.fn() }));
jest.mock('@/services/theme-storage', () => ({ clearThemeId: jest.fn() }));

beforeEach(() => {
  mockData = sample;
  setActiveLocale('tr');
});

describe('ListRow', () => {
  it('etiket olarak başlığı, alt metni ve sağdaki değeri birlikte okutur', async () => {
    const view = await render(<ListRow title="Salon" subtitle="Mekân" meta="₺1.250,50" onPress={jest.fn()} />);
    expect(view.getByLabelText('Salon, Mekân, ₺1.250,50')).toBeTruthy();
  });

  it('eksik parçaları atlar (artık virgül bırakmaz) ve açık etiketi tercih eder', async () => {
    const view = await render(
      <>
        <ListRow title="Yalnız başlık" onPress={jest.fn()} />
        <ListRow title="Alt metinli" subtitle="Ayrıntı" onPress={jest.fn()} />
        <ListRow title="Özel" subtitle="Ayrıntı" meta="Değer" accessibilityLabel="Özel okunuş" onPress={jest.fn()} />
      </>,
    );
    expect(view.getByLabelText('Yalnız başlık')).toBeTruthy();
    expect(view.getByLabelText('Alt metinli, Ayrıntı')).toBeTruthy();
    expect(view.getByLabelText('Özel okunuş')).toBeTruthy();
    expect(view.queryByLabelText('Özel, Ayrıntı, Değer')).toBeNull();
  });

  it('dokunulabilir satır buton rolündedir', async () => {
    const view = await render(<ListRow title="Salon" meta="Değer" onPress={jest.fn()} />);
    expect(view.getByRole('button', { name: 'Salon, Değer' })).toBeTruthy();
  });
});

describe('liste ekranlarında okunan etiketler', () => {
  it('davetli: ad, kişi sayısı ve yanıt durumu', async () => {
    const view = await render(<GuestsScreen />);
    const row = view.getByLabelText(/^Ayşe Test,/);
    expect(row.props.accessibilityLabel).toEqual(expect.stringContaining('3 kişi'));
    expect(row.props.accessibilityLabel).toEqual(expect.stringContaining('Katılıyor'));
  });

  it('bütçe kalemi: ad, kategori, vade ve tutar', async () => {
    const view = await render(<BudgetScreen />);
    const label = view.getByLabelText(/^Salon kirası,/).props.accessibilityLabel as string;
    expect(label).toContain('Mekân');
    expect(label).toMatch(/1\.250,50/);
  });

  it('tedarikçi: ad, kategori, sözleşme durumu ve teklif', async () => {
    const view = await render(<VendorsScreen />);
    const label = view.getByLabelText(/^Stüdyo Bir,/).props.accessibilityLabel as string;
    expect(label).toContain('Fotoğraf');
    expect(label).toMatch(/900,00/);
  });

  it('görev: öncelik, gecikme, tarih ve kategori; tamamlanan görev "Tamamlandı" der', async () => {
    const view = await render(<TasksScreen />);
    const open = view.getByLabelText(/^Salonu gez\./).props.accessibilityLabel as string;
    expect(open).toContain('Gecikti');
    expect(open).toContain('Yüksek öncelik');
    expect(open).toContain('Mekân');
    const done = view.getByLabelText(/^Orkestra ayarla\./).props.accessibilityLabel as string;
    expect(done).toContain('Tamamlandı');
    expect(done).not.toContain('Gecikti');
    expect(done).toContain('Düşük öncelik');
  });

  it('takvim: ay görünümünde ham gün numarası yerine tam tarih okunur', async () => {
    const view = await render(<CalendarScreen />);
    const label = view.getByLabelText(/^Salon kirası,/).props.accessibilityLabel as string;
    expect(label).toMatch(/Ödeme/);
    expect(label).toMatch(/2027/);
  });

  it('takvim: liste görünümünde tarih meta olarak etikete katılır', async () => {
    const view = await render(<CalendarScreen />);
    await fireEvent.press(view.getByLabelText(/Liste/));
    const label = view.getByLabelText(/^Salon kirası,/).props.accessibilityLabel as string;
    expect(label).toMatch(/2027/);
  });

  it('not: başlık, kısaltılmış ve tek satıra indirilmiş içerik, güncelleme tarihi', async () => {
    const view = await render(<NotesScreen />);
    const label = view.getByLabelText(/^Fikirler,/).props.accessibilityLabel as string;
    expect(label).toContain('Çiçekler ve masa süsleri');
    expect(label).not.toContain('\n');
  });

  it('ayarlar: bildirim satırı durumu tek kez söyler', async () => {
    const view = await render(<SettingsScreen />);
    const label = view.getByLabelText(/^Yerel bildirimler,/).props.accessibilityLabel as string;
    expect(label).toBe('Yerel bildirimler, İzin verildi');
  });
});
