import type { ReactElement } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import BudgetScreen from '@/app/(tabs)/budget';
import GuestsScreen from '@/app/(tabs)/guests';
import HomeScreen from '@/app/(tabs)/index';
import MoreScreen from '@/app/(tabs)/more';
import TasksScreen from '@/app/(tabs)/tasks';
import CalendarScreen from '@/app/calendar';
import ContactsImportScreen from '@/app/contacts-import';
import BudgetEditor from '@/app/edit/budget';
import GuestEditor from '@/app/edit/guest';
import NoteEditor from '@/app/edit/note';
import TaskEditor from '@/app/edit/task';
import VendorEditor from '@/app/edit/vendor';
import InvitationEditor from '@/app/invitation-editor';
import InvitationsScreen from '@/app/invitations';
import InviteSendScreen from '@/app/invite-send';
import LegalPageScreen from '@/app/legal/[page]';
import NotesScreen from '@/app/notes';
import OnboardingScreen from '@/app/onboarding';
import SettingsScreen from '@/app/settings';
import TablesScreen from '@/app/tables';
import VendorsScreen from '@/app/vendors';
import VenueEditorScreen from '@/app/venue-editor';
import { LanguageProvider } from '@/context/language-context';
import { createInvitationDesign } from '@/domain/invitation-content';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type AppData } from '@/domain/models';
import { createVenueLayoutItem } from '@/domain/venue-layout';
import { setActiveLocale } from '@/i18n';
import { EN, GUEST_DEFAULTS, TR } from './fixtures';

/**
 * Bu testler İngilizce seçiliyken tüm ekranları örnek veriyle çizer ve görünen metinlerde (ekran okuyucu etiketleri ve
 * placeholder'lar dahil) Türkçe metin kalmadığını doğrular. Örnek veri bilerek yalnız ASCII karakterlerden oluşur;
 * kullanıcı verisi zaten çevrilmez, bu yüzden Türkçe karakter görünürse çevrilmemiş sabit bir metin demektir.
 */

const now = '2026-10-02T10:00:00.000Z';
const profile = {
  ...EMPTY_PROFILE,
  couple1Name: 'Alice',
  couple2Name: 'Bob',
  weddingDate: '2027-06-12',
  estimatedBudgetCents: 1_000_000,
  estimatedGuestCount: 80,
  adultsOnly: true,
  onboardingCompleted: true,
};
const guest = (id: string, name: string, overrides = {}) => ({
  id,
  name,
  phone: '0532 111 22 33',
  side: 'common' as const,
  partySize: 2,
  childCount: 0,
  rsvp: 'attending' as const,
  notes: '',
  mealNotes: '',
  group: 'family' as const,
  ...GUEST_DEFAULTS,
  email: `${name.toLowerCase()}@example.com`,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});
const sample: AppData = {
  ...EMPTY_APP_DATA,
  profile,
  tasks: [
    {
      id: 't1',
      category: 'Venue',
      title: 'Visit the hall',
      description: 'Check capacity',
      dueDate: '2027-01-15',
      priority: 'high',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't2',
      category: 'Music',
      title: 'Book the band',
      description: '',
      dueDate: '2020-01-01',
      priority: 'low',
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
  guests: [
    guest('g1', 'Anna', { tableId: 'tb1', rsvpSource: 'manual', inviteStatus: 'opened', lastInviteChannel: 'sms' }),
    guest('g2', 'Ben', { rsvp: 'maybe', childCount: 1, rsvpSource: 'online' }),
    guest('g3', 'Cem', { rsvp: 'pending', phone: '' }),
    guest('g4', 'Dan', { rsvp: 'declined' }),
  ],
  tables: [{ id: 'tb1', name: 'Table 1', capacity: 8, createdAt: now, updatedAt: now }],
  venueLayoutItems: [
    createVenueLayoutItem({ id: 'v1', type: 'table', index: 0, now, label: 'Table 1', tableId: 'tb1' }),
    createVenueLayoutItem({ id: 'v2', type: 'stage', index: 1, now }),
  ],
  budgetItems: [
    {
      id: 'b1',
      category: 'Venue',
      title: 'Hall deposit',
      plannedCents: 100_000,
      actualCents: 120_000,
      paidCents: 50_000,
      dueDate: '2027-02-01',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ],
  vendors: [
    {
      id: 'vd1',
      category: 'Photo',
      name: 'Studio One',
      phone: '0212 555 11 22',
      email: 'studio@example.com',
      quoteCents: 90_000,
      contractStatus: 'quoted',
      paymentPlan: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  ],
  notes: [{ id: 'n1', title: 'Ideas', content: 'Flowers', createdAt: now, updatedAt: now }],
  invitationDesigns: [
    { ...createInvitationDesign('d1', 'boho', now, true, EN.t), message: '', weddingTime: '18:30', venueName: 'Hall' },
  ],
};

let mockParams: Record<string, string> = {};
let mockData: AppData = sample;
let mockAccess = 'granted';
jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: mockData,
    loading: false,
    createId: () => 'new-id',
    refresh: jest.fn(),
    saveTask: jest.fn(),
    deleteTask: jest.fn(),
    saveGuest: jest.fn(),
    deleteGuest: jest.fn(),
    saveTable: jest.fn(),
    deleteTable: jest.fn(),
    saveVenueLayoutItem: jest.fn(),
    deleteVenueLayoutItem: jest.fn(),
    saveBudgetItem: jest.fn(),
    deleteBudgetItem: jest.fn(),
    saveVendor: jest.fn(),
    deleteVendor: jest.fn(),
    saveNote: jest.fn(),
    deleteNote: jest.fn(),
    saveInvitationDesign: jest.fn(),
    deleteInvitationDesign: jest.fn(),
    saveProfile: jest.fn(),
    replaceAll: jest.fn(),
    clearAll: jest.fn(),
    completeOnboarding: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    dark: false,
    colors: {
      background: '#fff',
      primary: '#6F1D3A',
      accent: '#c7a86b',
      muted: '#666',
      warning: '#995500',
      danger: '#a33',
      success: '#356A50',
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
  const { AppText } = require('@/components/ui/app-text');
  return {
    Screen: ({ children, title, subtitle, action }: Record<string, React.ReactNode>) => (
      <View>
        {title ? <AppText>{title}</AppText> : null}
        {subtitle ? <AppText>{subtitle}</AppText> : null}
        {action}
        {children}
      </View>
    ),
  };
});
jest.mock('expo-localization', () => ({
  useLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }],
  getLocales: () => [{ languageCode: 'tr', languageTag: 'tr-TR' }],
}));
const mockStore = new Map<string, string>([['dugun-planim.language', 'en']]);
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: (key: string) => mockStore.get(key) ?? null, setItemSync: jest.fn() },
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
jest.mock('@/services/invitation-files', () => ({
  renderInvitationPdf: jest.fn(),
  renderInvitationPng: jest.fn(),
  shareGeneratedFile: jest.fn(),
}));
jest.mock('@/services/invitation-photos', () => ({ pickInvitationPhoto: jest.fn(), removeInvitationPhoto: jest.fn() }));
jest.mock('@/services/invite-sender', () => ({
  getDeviceCapabilities: jest.fn().mockResolvedValue({ mail: true, sms: true }),
  sendInvite: jest.fn(),
  shareInviteImage: jest.fn(),
  shareInviteText: jest.fn(),
}));
jest.mock('@/services/contacts', () => ({
  getContactsAccess: () => Promise.resolve(mockAccess),
  requestContactsAccess: () => Promise.resolve(mockAccess),
  presentLimitedAccessPicker: jest.fn(),
  loadContactCandidates: () =>
    Promise.resolve([
      {
        id: 'c1',
        firstName: 'Zoe',
        lastName: 'Lane',
        name: 'Zoe Lane',
        phones: [
          { value: '905321112233', display: '+90 532 111 22 33', label: '' },
          { value: '905331112233', display: '+90 533 111 22 33', label: '' },
        ],
        emails: [
          { value: 'zoe@example.com', display: 'zoe@example.com', label: '' },
          { value: 'z2@example.com', display: 'z2@example.com', label: '' },
        ],
      },
    ]),
}));

type Json = { type?: string; props?: Record<string, unknown>; children?: (Json | string)[] | null } | string | null;

/** Çizilen ağaçtaki tüm kullanıcıya görünen metinler ve erişilebilirlik/placeholder özellikleri. */
function visibleTexts(node: Json | Json[]): string[] {
  if (node === null || node === undefined) return [];
  if (Array.isArray(node)) return node.flatMap(visibleTexts);
  if (typeof node === 'string') return [node];
  const own = ['accessibilityLabel', 'accessibilityHint', 'placeholder', 'title']
    .map((key) => node.props?.[key])
    .filter((value): value is string => typeof value === 'string');
  return [...own, ...(node.children ?? []).flatMap(visibleTexts)];
}

const TURKISH = /[ğüşıöçĞÜŞİÖÇ]/;

async function expectEnglish(element: ReactElement, name: string) {
  const view = await render(<LanguageProvider>{element}</LanguageProvider>);
  await act(async () => {});
  const texts = visibleTexts(view.toJSON() as Json);
  const turkish = texts.filter((text) => TURKISH.test(text.replace(/Düğün Planım|Türkçe/g, '')));
  expect({ screen: name, turkish }).toEqual({ screen: name, turkish: [] });
  expect(texts.length).toBeGreaterThan(0);
  await view.unmount();
}

describe('every screen is fully English when English is selected', () => {
  beforeEach(() => {
    setActiveLocale('en');
    mockParams = {};
    mockData = sample;
    mockAccess = 'granted';
  });
  afterEach(() => setActiveLocale('tr'));

  const screens: [string, () => ReactElement, Record<string, string>?][] = [
    ['home', () => <HomeScreen />],
    ['tasks', () => <TasksScreen />],
    ['guests', () => <GuestsScreen />],
    ['budget', () => <BudgetScreen />],
    ['more', () => <MoreScreen />],
    ['tables', () => <TablesScreen />],
    ['venue editor', () => <VenueEditorScreen />],
    ['vendors', () => <VendorsScreen />],
    ['notes', () => <NotesScreen />],
    ['calendar', () => <CalendarScreen />],
    ['settings', () => <SettingsScreen />],
    ['invitations', () => <InvitationsScreen />],
    ['invitation editor', () => <InvitationEditor />, { id: 'd1' }],
    ['new invitation', () => <InvitationEditor />, { template: 'night' }],
    ['send invitations', () => <InviteSendScreen />],
    ['contacts import', () => <ContactsImportScreen />],
    ['guest editor', () => <GuestEditor />, { id: 'g1' }],
    ['new guest', () => <GuestEditor />],
    ['task editor', () => <TaskEditor />, { id: 't1' }],
    ['budget editor', () => <BudgetEditor />, { id: 'b1' }],
    ['vendor editor', () => <VendorEditor />, { id: 'vd1' }],
    ['new vendor', () => <VendorEditor />],
    ['note editor', () => <NoteEditor />, { id: 'n1' }],
    ['legal privacy', () => <LegalPageScreen />, { page: 'privacy' }],
    ['legal terms', () => <LegalPageScreen />, { page: 'terms' }],
    ['legal data', () => <LegalPageScreen />, { page: 'data' }],
    ['legal licenses', () => <LegalPageScreen />, { page: 'licenses' }],
    ['legal support', () => <LegalPageScreen />, { page: 'support' }],
  ];

  it.each(screens.map(([name, make, params]) => [name, make, params ?? {}] as const))(
    '%s',
    async (name, make, params) => {
      mockParams = params ?? {};
      await expectEnglish(make(), name);
    },
  );

  it('empty states are English too', async () => {
    mockData = { ...EMPTY_APP_DATA, profile };
    for (const [name, screen] of [
      ['tasks', <TasksScreen key="a" />],
      ['guests', <GuestsScreen key="b" />],
      ['budget', <BudgetScreen key="c" />],
      ['tables', <TablesScreen key="d" />],
      ['vendors', <VendorsScreen key="e" />],
      ['notes', <NotesScreen key="f" />],
      ['calendar', <CalendarScreen key="g" />],
      ['home', <HomeScreen key="h" />],
      ['venue editor', <VenueEditorScreen key="i" />],
      ['invitations', <InvitationsScreen key="j" />],
      ['send invitations', <InviteSendScreen key="k" />],
    ] as const) {
      await expectEnglish(screen, `${name} (empty)`);
    }
  });

  it.each(['undetermined', 'denied', 'blocked', 'unavailable', 'limited'])(
    'contacts import in the %s permission state',
    async (access) => {
      mockAccess = access;
      await expectEnglish(<ContactsImportScreen />, `contacts ${access}`);
    },
  );

  it('onboarding steps', async () => {
    const view = await render(
      <LanguageProvider>
        <OnboardingScreen />
      </LanguageProvider>,
    );
    expect(view.getByText('Every detail, in one calm plan.')).toBeTruthy();
    const check = (label: string) => {
      const texts = visibleTexts(view.toJSON() as Json);
      const turkish = texts.filter((text) => TURKISH.test(text.replace(/Düğün Planım|Türkçe/g, '')));
      expect({ step: label, turkish }).toEqual({ step: label, turkish: [] });
    };
    check('welcome');
    await fireEvent.press(view.getByLabelText("Let's start"));
    check('names');
    await fireEvent.changeText(view.getByLabelText('First name'), 'Alice');
    await fireEvent.changeText(view.getByLabelText('Second name'), 'Bob');
    await fireEvent.press(view.getByLabelText('Continue'));
    check('basics');
    expect(view.getByLabelText('Wedding date: not selected. Tap to change.')).toBeTruthy();
  });

  it('Turkish labels remain available for the same screens when Turkish is selected', async () => {
    setActiveLocale('tr');
    mockStore.set('dugun-planim.language', 'tr');
    try {
      const view = await render(
        <LanguageProvider>
          <MoreScreen />
        </LanguageProvider>,
      );
      expect(view.getByText('Masa planı')).toBeTruthy();
      expect(TR.t('more.tables')).toBe('Masa planı');
    } finally {
      mockStore.set('dugun-planim.language', 'en');
    }
  });
});
