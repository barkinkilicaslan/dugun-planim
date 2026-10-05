import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import InviteSendScreen from '@/app/invite-send';
import { EMPTY_PROFILE, type Guest, type PersonalInvitation } from '@/domain/models';
import { GUEST_DEFAULTS } from './fixtures';

const now = '2026-10-03T10:00:00.000Z';
const profile = { ...EMPTY_PROFILE, couple1Name: 'Ada', couple2Name: 'Deniz', weddingDate: '2027-06-12' };
const personal: PersonalInvitation = {
  id: 'p1',
  name: 'Bahçe davetiyesi',
  imageUri: 'file:///docs/personal-invitations/p1-100.jpg',
  width: 1000,
  height: 1400,
  createdAt: now,
  updatedAt: now,
};
const prepared = { uri: 'file:///cache/davetiye-bahce-davetiyesi.jpg', mimeType: 'image/jpeg', filename: 'd.jpg' };
const guest = (id: string, name: string, phone: string, email = ''): Guest => ({
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
  email,
  createdAt: now,
  updatedAt: now,
});
const mockProfile = profile;
const mockPersonal = personal;
const mockGuests = [guest('g1', 'Ayşe', '0532 111 22 33', 'ayse@example.test')];

let mockParams: Record<string, string> = { personalId: 'p1' };
const mockSaveGuest = jest.fn().mockResolvedValue(undefined);
const mockSendInvite = jest.fn();
const mockShareImage = jest.fn();
const mockRenderPng = jest.fn();
const mockPrepare = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: {
      ...jest.requireActual('@/domain/models').EMPTY_APP_DATA,
      profile: mockProfile,
      guests: mockGuests,
      invitationDesigns: [],
      personalInvitations: [mockPersonal],
    },
    saveGuest: (...args: unknown[]) => mockSaveGuest(...args),
  }),
}));
jest.mock('@/services/invite-sender', () => ({
  getDeviceCapabilities: jest.fn().mockResolvedValue({ mail: true, sms: true }),
  sendInvite: (...args: unknown[]) => mockSendInvite(...args),
  shareInviteText: jest.fn(),
  shareInviteImage: (...args: unknown[]) => mockShareImage(...args),
}));
jest.mock('@/services/invitation-files', () => ({
  renderInvitationPng: (...args: unknown[]) => mockRenderPng(...args),
}));
jest.mock('@/services/personal-invitations', () => ({
  preparePersonalInvitationFile: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
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

async function start(view: Awaited<ReturnType<typeof render>>, channelLabel: string) {
  await fireEvent.press(view.getByLabelText(channelLabel));
  await fireEvent.press(view.getByLabelText('Tümünü seç'));
  await fireEvent.press(view.getByLabelText(/kişi için başlat/));
}

describe('sending an uploaded invitation', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { personalId: 'p1' };
    mockPrepare.mockResolvedValue(prepared);
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });
  afterEach(() => alert.mockRestore());

  it('previews the uploaded image instead of a template and names it in the subtitle', async () => {
    const view = await render(<InviteSendScreen />);
    expect(view.getByLabelText('Bahçe davetiyesi davetiye önizlemesi')).toBeTruthy();
    expect(mockRenderPng).not.toHaveBeenCalled();
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it('shares the prepared image URI through the system share sheet, never sending anything by itself', async () => {
    const view = await render(<InviteSendScreen />);
    await start(view, 'Kanal: Paylaşım menüsü');
    await waitFor(() => expect(mockPrepare).toHaveBeenCalledWith(personal));
    expect(mockRenderPng).not.toHaveBeenCalled();
    // Kuyruk başlayana kadar hiçbir sistem ekranı açılmaz.
    expect(mockSendInvite).not.toHaveBeenCalled();
    await fireEvent.press(await view.findByLabelText('Görseli ayrıca paylaş'));
    expect(mockShareImage).toHaveBeenCalledWith(prepared);
  });

  it('attaches the uploaded image to the e-mail composer only when the user opens it', async () => {
    mockSendInvite.mockResolvedValue('opened');
    const view = await render(<InviteSendScreen />);
    await fireEvent.press(view.getByLabelText('Kanal: E-posta'));
    expect(view.getByText('Yüklenen davetiye görselini ekle')).toBeTruthy();
    await start(view, 'Kanal: E-posta');
    await waitFor(() => expect(mockPrepare).toHaveBeenCalled());
    expect(mockSendInvite).not.toHaveBeenCalled();
    await fireEvent.press(await view.findByLabelText('E-posta ekranını aç'));
    await waitFor(() => expect(mockSendInvite).toHaveBeenCalledTimes(1));
    expect(mockSendInvite).toHaveBeenCalledWith(
      'email',
      expect.objectContaining({ id: 'g1' }),
      expect.objectContaining({ attachment: prepared, body: expect.stringContaining('Ayşe') }),
    );
    // Yalnız ekran açıldı; gönderildi olarak kaydedilmez.
    expect(mockSaveGuest.mock.calls[0][0]).toMatchObject({ inviteStatus: 'opened', lastInviteChannel: 'email' });
  });

  it('does not prepare a file for text-only channels and says the e-mail note is format neutral', async () => {
    const view = await render(<InviteSendScreen />);
    await start(view, 'Kanal: SMS');
    await view.findByLabelText('SMS ekranını aç');
    expect(mockPrepare).not.toHaveBeenCalled();
    const email = await render(<InviteSendScreen />);
    await fireEvent.press(email.getAllByLabelText('Kanal: E-posta')[0]);
    expect(email.getAllByText(/yüklediğiniz davetiye görseli ek olarak eklenir/).length).toBeGreaterThan(0);
  });

  it('shows a clear error and opens nothing when the image file is gone', async () => {
    mockPrepare.mockRejectedValue(new Error('Davetiye görseli bulunamadı. Dosya silinmiş olabilir.'));
    const view = await render(<InviteSendScreen />);
    await start(view, 'Kanal: Paylaşım menüsü');
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Davetiye hazırlanamadı', expect.stringMatching(/bulunamadı/)),
    );
    expect(view.queryByLabelText('Paylaşım menüsü ekranını aç')).toBeNull();
    expect(mockSendInvite).not.toHaveBeenCalled();
    expect(mockSaveGuest).not.toHaveBeenCalled();
  });

  it('handles an unknown uploaded invitation id', async () => {
    mockParams = { personalId: 'missing' };
    const view = await render(<InviteSendScreen />);
    expect(view.getByText('Bu davetiye silinmiş olabilir.')).toBeTruthy();
  });
});
