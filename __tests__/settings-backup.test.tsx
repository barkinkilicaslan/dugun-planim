import { Alert, type AlertButton } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SettingsScreen from '@/app/settings';
import { createBackup } from '@/domain/backup';
import { BACKUP_PHOTO_NOTICE_BODY, BACKUP_PHOTO_NOTICE_TITLE, restoreCompleteMessage } from '@/domain/backup-notices';
import { createInvitationDesign } from '@/domain/invitation-content';
import { EMPTY_APP_DATA, EMPTY_PROFILE } from '@/domain/models';

const now = '2026-10-02T10:00:00.000Z';
const profile = {
  ...EMPTY_PROFILE,
  couple1Name: 'Ada',
  couple2Name: 'Deniz',
  weddingDate: '2027-06-12',
  estimatedBudgetCents: 100,
  estimatedGuestCount: 2,
  onboardingCompleted: true,
};
const design = { ...createInvitationDesign('d1', 'boho', now, true), photoUri: 'file:///x/invitation-photos/d1.jpg' };
const data = { ...EMPTY_APP_DATA, profile, invitationDesigns: [design] };

const mockReplaceAll = jest.fn().mockResolvedValue(undefined);
const mockShareText = jest.fn().mockResolvedValue(undefined);
const mockPickText = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({ data: mockData(), saveProfile: jest.fn(), replaceAll: mockReplaceAll, clearAll: jest.fn() }),
}));
const mockData = () => data;
jest.mock('@/services/export', () => ({
  shareTextFile: (...args: unknown[]) => mockShareText(...args),
  pickTextFile: (...args: unknown[]) => mockPickText(...args),
}));
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

function lastAlert(spy: jest.SpyInstance) {
  const call = spy.mock.calls[spy.mock.calls.length - 1] as [string, string | undefined, AlertButton[] | undefined];
  return { title: call[0], message: call[1] ?? '', buttons: call[2] ?? [] };
}

describe('backup photo notices', () => {
  let alert: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });
  afterEach(() => alert.mockRestore());

  it('warns before creating a backup and only shares after the user continues', async () => {
    const view = await render(<SettingsScreen />);
    await fireEvent.press(view.getByLabelText('Yedek dosyası oluştur'));
    const shown = lastAlert(alert);
    expect(shown.title).toBe(BACKUP_PHOTO_NOTICE_TITLE);
    expect(shown.message).toBe(BACKUP_PHOTO_NOTICE_BODY);
    expect(shown.message).toMatch(/fotoğrafları içermez/);
    expect(mockShareText).not.toHaveBeenCalled();
    await shown.buttons.find((button) => button.text === 'Yedeği oluştur')?.onPress?.();
    await waitFor(() => expect(mockShareText).toHaveBeenCalledTimes(1));
    expect(mockShareText.mock.calls[0][1]).toContain('"templateId": "boho"');
  });

  it('cancelling the warning creates no backup', async () => {
    const view = await render(<SettingsScreen />);
    await fireEvent.press(view.getByLabelText('Yedek dosyası oluştur'));
    expect(lastAlert(alert).buttons.find((button) => button.text === 'Vazgeç')?.style).toBe('cancel');
    expect(mockShareText).not.toHaveBeenCalled();
  });

  it('the backup file keeps the design but no photo path, and says so after restoring', async () => {
    const view = await render(<SettingsScreen />);
    const raw = createBackup(data);
    expect(raw).not.toContain('invitation-photos');
    expect(raw).toContain('"photoUri": ""');
    mockPickText.mockResolvedValueOnce(raw);
    await fireEvent.press(view.getByLabelText('Yedekten geri yükle'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    const confirm = lastAlert(alert);
    expect(confirm.title).toBe('Yedek geri yüklensin mi?');
    expect(confirm.message).toContain(BACKUP_PHOTO_NOTICE_BODY);
    await confirm.buttons.find((button) => button.text === 'Geri yükle')?.onPress?.();
    await waitFor(() => expect(mockReplaceAll).toHaveBeenCalled());
    const restored = mockReplaceAll.mock.calls[0][0] as typeof data;
    expect(restored.invitationDesigns[0]).toMatchObject({ templateId: 'boho', photoUri: '' });
    await waitFor(() => expect(lastAlert(alert).title).toBe('Tamamlandı'));
    expect(lastAlert(alert).message).toBe(restoreCompleteMessage(1));
    expect(lastAlert(alert).message).toMatch(/fotoğrafları .* boş/);
  });

  it('does not mention photos after restoring a backup without designs', () => {
    expect(restoreCompleteMessage(0)).toBe('Yedek başarıyla geri yüklendi.');
  });
});
