import { Alert, type AlertButton } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import InviteSendScreen from '@/app/invite-send';
import { channelNote } from '@/domain/invite-dispatch';
import { createInvitationDesign } from '@/domain/invitation-content';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type Guest } from '@/domain/models';
import { GUEST_DEFAULTS, TR } from './fixtures';

const now = '2026-10-02T10:00:00.000Z';
const profile = { ...EMPTY_PROFILE, couple1Name: 'Ada', couple2Name: 'Deniz', weddingDate: '2027-06-12' };
const guest = (id: string, name: string, phone: string): Guest => ({
  id,
  name,
  phone,
  side: 'common',
  partySize: 1,
  childCount: 0,
  rsvp: 'pending',
  notes: '',
  mealNotes: '',
  group: 'other',
  ...GUEST_DEFAULTS,
  createdAt: now,
  updatedAt: now,
});
const guests = [
  guest('g1', 'Ayşe', '0532 111 22 33'),
  guest('g2', 'Mehmet', '0533 222 33 44'),
  guest('g3', 'Telefonsuz', ''),
];

const mockSaveGuest = jest.fn().mockResolvedValue(undefined);
const mockSendInvite = jest.fn();
const mockShareText = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: {
      ...jest.requireActual('@/domain/models').EMPTY_APP_DATA,
      profile: mockProfile,
      guests: mockGuests,
      invitationDesigns: [mockDesign],
    },
    saveGuest: (...args: unknown[]) => mockSaveGuest(...args),
  }),
}));
const mockProfile = profile;
const mockGuests = guests;
const mockDesign = createInvitationDesign('d1', 'classic', now, true, TR.t);
jest.mock('@/services/invite-sender', () => ({
  getDeviceCapabilities: jest.fn().mockResolvedValue({ mail: true, sms: true }),
  sendInvite: (...args: unknown[]) => mockSendInvite(...args),
  shareInviteText: (...args: unknown[]) => mockShareText(...args),
  shareInviteImage: jest.fn(),
}));
jest.mock('@/services/invitation-files', () => ({
  renderInvitationPng: jest
    .fn()
    .mockResolvedValue({ uri: 'file:///davetiye.png', mimeType: 'image/png', filename: 'd.png' }),
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
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

async function startQueue(view: Awaited<ReturnType<typeof render>>, channelLabel = 'Kanal: SMS') {
  await fireEvent.press(view.getByLabelText(channelLabel));
  await fireEvent.press(view.getByLabelText('Tümünü seç'));
  await fireEvent.press(view.getByLabelText(/kişi için başlat/));
}

describe('invite sending screen', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });
  afterEach(() => alert.mockRestore());

  it('tells the truth about what each channel carries', async () => {
    const view = await render(<InviteSendScreen />);
    await fireEvent.press(view.getByLabelText('Kanal: SMS'));
    expect(view.getByText(channelNote(TR.t, 'sms', true))).toBeTruthy();
    expect(channelNote(TR.t, 'sms', true)).toMatch(/yalnızca metin/);
    expect(channelNote(TR.t, 'sms', true)).toMatch(/otomatik eklenmez/);
    await fireEvent.press(view.getByLabelText('Kanal: WhatsApp'));
    expect(view.getByText(channelNote(TR.t, 'whatsapp', true))).toBeTruthy();
    expect(channelNote(TR.t, 'whatsapp', true)).toMatch(/yalnızca metin taşır/);
    expect(channelNote(TR.t, 'whatsapp', true)).toMatch(/Paylaşım menüsü/);
    await fireEvent.press(view.getByLabelText('Kanal: E-posta'));
    expect(view.getByText(channelNote(TR.t, 'email', true))).toBeTruthy();
    expect(channelNote(TR.t, 'email', true)).toMatch(/PNG/);
    expect(channelNote(TR.t, 'email', false)).toMatch(/görsel eklenmez/);
    await fireEvent.press(view.getByLabelText('Kanal: Paylaşım menüsü'));
    expect(view.getByText(channelNote(TR.t, 'share', true))).toBeTruthy();
    expect(channelNote(TR.t, 'share', true)).toMatch(/tek adımda birlikte gönderilmez/);
  });

  it('does not select guests who cannot be reached on the channel', async () => {
    const view = await render(<InviteSendScreen />);
    await fireEvent.press(view.getByLabelText('Kanal: SMS'));
    await fireEvent.press(view.getByLabelText('Tümünü seç'));
    expect(view.getByLabelText('2 kişi için başlat')).toBeTruthy();
    expect(view.getByLabelText(/Telefonsuz, Davetlinin geçerli telefon numarası yok/)).toBeTruthy();
  });

  it('records "screen opened" — never "sent" — when the system cannot confirm delivery', async () => {
    mockSendInvite.mockResolvedValue('opened');
    const view = await render(<InviteSendScreen />);
    await startQueue(view);
    await fireEvent.press(view.getByLabelText('SMS ekranını aç'));
    await waitFor(() => expect(mockSaveGuest).toHaveBeenCalledTimes(1));
    const saved = mockSaveGuest.mock.calls[0][0] as Guest;
    expect(saved).toMatchObject({ id: 'g1', inviteStatus: 'opened', lastInviteChannel: 'sms' });
    expect(saved.inviteStatus).not.toBe('markedSent');
    expect(mockSendInvite).toHaveBeenCalledWith('sms', expect.objectContaining({ id: 'g1' }), expect.anything());
    // Sıradaki kişi hâlâ kullanıcı onayı bekliyor; otomatik gönderim yok.
    expect(mockSendInvite).toHaveBeenCalledTimes(1);
    expect(view.getByText(/Mehmet \(2\/2\)/)).toBeTruthy();
  });

  it('only a system-confirmed send is stored as sent', async () => {
    mockSendInvite.mockResolvedValue('sent');
    const view = await render(<InviteSendScreen />);
    await startQueue(view);
    await fireEvent.press(view.getByLabelText('SMS ekranını aç'));
    await waitFor(() => expect(mockSaveGuest).toHaveBeenCalled());
    expect(mockSaveGuest.mock.calls[0][0]).toMatchObject({ inviteStatus: 'markedSent' });
  });

  it('a cancelled composer records nothing and stays on the same guest', async () => {
    mockSendInvite.mockResolvedValue('cancelled');
    const view = await render(<InviteSendScreen />);
    await startQueue(view);
    await fireEvent.press(view.getByLabelText('SMS ekranını aç'));
    await waitFor(() => expect(mockSendInvite).toHaveBeenCalled());
    expect(mockSaveGuest).not.toHaveBeenCalled();
    expect(view.getByText(/Ayşe \(1\/2\)/)).toBeTruthy();
  });

  it('skipping moves on without recording, and cancelling stops the whole queue', async () => {
    const view = await render(<InviteSendScreen />);
    await startQueue(view);
    await fireEvent.press(view.getByLabelText('Bu kişiyi atla'));
    expect(view.getByText(/Mehmet \(2\/2\)/)).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Kuyruğu iptal et'));
    expect(view.getByText('Gönderim iptal edildi')).toBeTruthy();
    expect(mockSendInvite).not.toHaveBeenCalled();
    expect(mockSaveGuest).not.toHaveBeenCalled();
    expect(view.queryByLabelText('SMS ekranını aç')).toBeNull();
  });

  it('offers the share sheet when WhatsApp cannot be opened and records nothing yet', async () => {
    mockSendInvite.mockResolvedValue('unavailable');
    const view = await render(<InviteSendScreen />);
    await startQueue(view, 'Kanal: WhatsApp');
    await fireEvent.press(view.getByLabelText('WhatsApp ekranını aç'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    const [title, message, buttons] = alert.mock.calls[0] as [string, string, AlertButton[]];
    expect(title).toMatch(/WhatsApp açılamadı/);
    expect(message).toMatch(/paylaşım menüsüyle/);
    expect(buttons.map((button) => button.text)).toEqual(['Vazgeç', 'Paylaşım menüsünü aç']);
    expect(mockSaveGuest).not.toHaveBeenCalled();
    mockShareText.mockResolvedValueOnce('opened');
    await buttons[1].onPress?.();
    await waitFor(() => expect(mockSaveGuest).toHaveBeenCalledTimes(1));
    expect(mockSaveGuest.mock.calls[0][0]).toMatchObject({ inviteStatus: 'opened', lastInviteChannel: 'whatsapp' });
  });

  it('the user can mark an opened invite as sent afterwards', async () => {
    mockSendInvite.mockResolvedValue('opened');
    const view = await render(<InviteSendScreen />);
    await startQueue(view);
    await fireEvent.press(view.getByLabelText('SMS ekranını aç'));
    await waitFor(() => expect(mockSaveGuest).toHaveBeenCalledTimes(1));
    await fireEvent.press(view.getAllByLabelText('Gönderildi işaretle')[0]);
    await waitFor(() => expect(mockSaveGuest).toHaveBeenCalledTimes(2));
    expect(mockSaveGuest.mock.calls[1][0]).toMatchObject({ id: 'g1', inviteStatus: 'markedSent' });
  });
});
