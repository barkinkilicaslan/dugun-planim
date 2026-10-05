import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import PersonalInvitationScreen from '@/app/personal-invitation';
import type { PersonalInvitation } from '@/domain/models';
import { PersonalInvitationError } from '@/services/personal-invitations';
import { TR } from './fixtures';

const OLD = 'file:///docs/personal-invitations/p1-100.jpg';
const NEW = 'file:///docs/personal-invitations/p1-200.png';
const now = '2026-10-03T10:00:00.000Z';
const invitation = (overrides: Partial<PersonalInvitation> = {}): PersonalInvitation => ({
  id: 'p1',
  name: 'Bahçe davetiyesi',
  imageUri: OLD,
  width: 1000,
  height: 1400,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const mockRemoveFile = jest.fn().mockResolvedValue(true);
const mockPickLibrary = jest.fn();
const mockPrepare = jest.fn();
const mockShareFile = jest.fn();
const mockPush = jest.fn();
let mockGuestCount = 1;
jest.mock('@/services/invitation-files', () => ({
  shareGeneratedFile: (file: unknown) => mockShareFile(file),
}));
const mockPickFiles = jest.fn();
jest.mock('@/services/personal-invitations', () => {
  class PersonalInvitationError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }
  return {
    PersonalInvitationError,
    pickInvitationFromLibrary: (id: string) => mockPickLibrary(id),
    pickInvitationFromFiles: (id: string) => mockPickFiles(id),
    removePersonalInvitationFile: (uri?: string) => mockRemoveFile(uri),
    preparePersonalInvitationFile: (item: unknown) => mockPrepare(item),
  };
});
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
let mockPersonal: PersonalInvitation[] = [];
const mockSave = jest.fn();
const mockDelete = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (path: string) => mockReplace(path),
    push: (path: string) => mockPush(path),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/context/app-context', () => {
  const actual = jest.requireActual('@/context/app-context');
  return {
    ...actual,
    useApp: () => ({
      data: {
        ...jest.requireActual('@/domain/models').EMPTY_APP_DATA,
        personalInvitations: mockPersonal,
        guests: Array.from({ length: mockGuestCount }, (_, index) => ({ id: 'g' + index })),
      },
      createId: () => 'new-id',
      savePersonalInvitation: mockSave,
      deletePersonalInvitation: mockDelete,
    }),
  };
});
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

describe('personal invitation screen', () => {
  let alertSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockPersonal = [];
    mockGuestCount = 1;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('shows the empty state with both sources and the local-only notice', async () => {
    await render(<PersonalInvitationScreen />);
    expect(screen.getByText('Davetiye yükleyin')).toBeTruthy();
    expect(screen.getByText('Fotoğraflardan seç')).toBeTruthy();
    expect(screen.getByText('Dosyalardan seç')).toBeTruthy();
  });

  it('picks from Photos, saves with a default name and opens the saved invitation', async () => {
    mockPickLibrary.mockResolvedValue({ uri: NEW, width: 900, height: 1200 });
    mockSave.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Fotoğraflardan seç'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockPickLibrary).toHaveBeenCalledWith('new-id');
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-id', name: 'Davetiyem 1', imageUri: NEW, width: 900, height: 1200 }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/personal-invitation?id=new-id');
  });

  it('does nothing when the picker is cancelled', async () => {
    mockPickFiles.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Dosyalardan seç'));
    await waitFor(() => expect(mockPickFiles).toHaveBeenCalled());
    expect(mockSave).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('explains a denied photo permission and offers Settings', async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    mockPickLibrary.mockRejectedValue(new PersonalInvitationError('permission', TR.t('personal.error.permission')));
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Fotoğraflardan seç'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    const [title, message, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Davetiye yüklenemedi');
    expect(message).toMatch(/izni verilmedi/);
    await act(async () => buttons.find((button: { text: string }) => button.text === 'Ayarlar’ı aç').onPress());
    expect(openSettings).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('shows format errors without saving anything', async () => {
    mockPickFiles.mockRejectedValue(new PersonalInvitationError('format', TR.t('personal.error.badFormat')));
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Dosyalardan seç'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith('Davetiye yüklenemedi', expect.stringMatching(/JPG veya PNG/)),
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('removes the freshly copied file when saving fails', async () => {
    mockPickLibrary.mockResolvedValue({ uri: NEW, width: 10, height: 10 });
    mockSave.mockRejectedValue(new Error('disk dolu'));
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Fotoğraflardan seç'));
    await waitFor(() => expect(mockRemoveFile).toHaveBeenCalledWith(NEW));
    expect(alertSpy).toHaveBeenCalledWith('Davetiye kaydedilemedi', 'disk dolu');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('previews an uploaded invitation with an accessible label and replaces it', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    mockPickLibrary.mockResolvedValue({ uri: NEW, width: 800, height: 1100 });
    mockSave.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    expect(screen.getByLabelText('Bahçe davetiyesi davetiye önizlemesi')).toBeTruthy();
    await fireEvent.press(screen.getByText('Fotoğraflardan değiştir'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockPickLibrary).toHaveBeenCalledWith('p1');
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', name: 'Bahçe davetiyesi', imageUri: NEW, createdAt: now }),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('asks before deleting and goes back afterwards', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    mockDelete.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Davetiyeyi sil'));
    expect(mockDelete).not.toHaveBeenCalled();
    const [title, , buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Davetiye silinsin mi?');
    await act(async () => buttons.find((button: { style?: string }) => button.style === 'destructive').onPress());
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockDelete).toHaveBeenCalledWith('p1');
  });

  it('renames without touching the image', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    mockSave.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    await fireEvent.changeText(screen.getByLabelText('Davetiye adı'), 'Nişan davetiyesi');
    await fireEvent.press(screen.getByText('Adı kaydet'));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nişan davetiyesi', imageUri: OLD })),
    );
  });

  it('shows a clear message when the stored image cannot be loaded', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    await render(<PersonalInvitationScreen />);
    await fireEvent(screen.getByLabelText('Bahçe davetiyesi davetiye önizlemesi'), 'error');
    expect(screen.getByText(/Görsel gösterilemiyor/)).toBeTruthy();
    expect(screen.getByText('Davetiyeyi sil')).toBeTruthy();
  });

  it('handles an unknown id', async () => {
    mockParams = { id: 'missing' };
    await render(<PersonalInvitationScreen />);
    expect(screen.getByText('Davetiye bulunamadı')).toBeTruthy();
  });

  it('shares the prepared image through the system share sheet and sends nothing by itself', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    const prepared = { uri: 'file:///cache/davetiye-bahce.jpg', mimeType: 'image/jpeg', filename: 'd.jpg' };
    mockPrepare.mockResolvedValue(prepared);
    mockShareFile.mockResolvedValue(undefined);
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Görseli paylaş'));
    await waitFor(() => expect(mockShareFile).toHaveBeenCalledWith(prepared));
    expect(mockPrepare).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', imageUri: OLD }));
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('explains a missing image file when sharing instead of failing silently', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    mockPrepare.mockRejectedValue(new PersonalInvitationError('missing', TR.t('personal.error.fileMissing')));
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Görseli paylaş'));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Davetiye paylaşılamadı',
        expect.stringMatching(/Davetiye görseli bulunamadı/),
      ),
    );
    expect(mockShareFile).not.toHaveBeenCalled();
  });

  it('opens the guest sending flow for this uploaded invitation', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    await render(<PersonalInvitationScreen />);
    await fireEvent.press(screen.getByText('Davetlilere gönder'));
    expect(mockPush).toHaveBeenCalledWith('/invite-send?personalId=p1');
  });

  it('asks for guests first when there are none', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    mockGuestCount = 0;
    await render(<PersonalInvitationScreen />);
    expect(screen.getByText('Davetlilere göndermek için önce davetli ekleyin.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Davetlilere gönder'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('disables sharing when the stored image cannot be loaded', async () => {
    mockParams = { id: 'p1' };
    mockPersonal = [invitation()];
    await render(<PersonalInvitationScreen />);
    await fireEvent(screen.getByLabelText('Bahçe davetiyesi davetiye önizlemesi'), 'error');
    await fireEvent.press(screen.getByText('Görseli paylaş'));
    expect(mockPrepare).not.toHaveBeenCalled();
  });
});
