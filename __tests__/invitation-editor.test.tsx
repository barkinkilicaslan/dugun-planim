import { fireEvent, render, waitFor } from '@testing-library/react-native';

import InvitationEditor from '@/app/invitation-editor';
import { createInvitationDesign } from '@/domain/invitation-content';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type InvitationDesign } from '@/domain/models';

const OLD = 'file:///docs/invitation-photos/d1-100.jpg';
const NEW = 'file:///docs/invitation-photos/d1-200.jpg';
const NEWER = 'file:///docs/invitation-photos/d1-300.jpg';
const now = '2026-10-02T10:00:00.000Z';
const profile = { ...EMPTY_PROFILE, couple1Name: 'Ada', couple2Name: 'Deniz', weddingDate: '2027-06-12' };
const designWithPhoto = (): InvitationDesign => ({ ...createInvitationDesign('d1', 'boho', now, true), photoUri: OLD });

const mockRemovePhoto = jest.fn().mockResolvedValue(true);
const mockPickPhoto = jest.fn();
jest.mock('@/services/invitation-photos', () => ({
  pickInvitationPhoto: (id: string) => mockPickPhoto(id),
  removeInvitationPhoto: (uri?: string) => mockRemovePhoto(uri),
}));
jest.mock('@/services/invitation-files', () => ({
  renderInvitationPdf: jest.fn(),
  renderInvitationPng: jest.fn(),
  shareGeneratedFile: jest.fn(),
}));

const mockProfile = () => profile;
const mockSave = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
let mockDesigns: InvitationDesign[] = [];
jest.mock('@/context/app-context', () => {
  return {
    useApp: () => ({
      data: {
        ...jest.requireActual('@/domain/models').EMPTY_APP_DATA,
        profile: mockProfile(),
        invitationDesigns: mockDesigns,
      },
      createId: () => 'new-design',
      saveInvitationDesign: mockSave,
      deleteInvitationDesign: jest.fn(),
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
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
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

describe('invitation editor photo flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
  });

  async function openExisting() {
    mockDesigns = [designWithPhoto()];
    mockParams = { id: 'd1' };
    return render(<InvitationEditor />);
  }

  it('picking a new photo never deletes the saved photo, even before saving', async () => {
    mockPickPhoto.mockResolvedValueOnce(NEW);
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await waitFor(() => expect(mockPickPhoto).toHaveBeenCalled());
    expect(mockRemovePhoto).not.toHaveBeenCalledWith(OLD);
    expect(mockRemovePhoto).not.toHaveBeenCalled();
  });

  it('leaving without saving removes only the new file and keeps the saved photo', async () => {
    mockPickPhoto.mockResolvedValueOnce(NEW);
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await waitFor(() => expect(mockPickPhoto).toHaveBeenCalled());
    await view.unmount();
    expect(mockRemovePhoto).toHaveBeenCalledWith(NEW);
    expect(mockRemovePhoto).not.toHaveBeenCalledWith(OLD);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('replacing an unsaved pick removes the intermediate file immediately', async () => {
    mockPickPhoto.mockResolvedValueOnce(NEW).mockResolvedValueOnce(NEWER);
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await waitFor(() => expect(mockRemovePhoto).toHaveBeenCalledWith(NEW));
    expect(mockRemovePhoto).not.toHaveBeenCalledWith(OLD);
  });

  it('saving keeps the new photo (old one is cleaned by the context after persistence)', async () => {
    mockPickPhoto.mockResolvedValueOnce(NEW);
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await waitFor(() => expect(mockPickPhoto).toHaveBeenCalled());
    await fireEvent.press(view.getByLabelText('Kaydet'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1', photoUri: NEW }));
    await view.unmount();
    expect(mockRemovePhoto).not.toHaveBeenCalled();
  });

  it('a failed save keeps the old photo and cleans the unused new file on exit', async () => {
    mockSave.mockRejectedValueOnce(new Error('kayıt hatası'));
    mockPickPhoto.mockResolvedValueOnce(NEW);
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı değiştir'));
    await waitFor(() => expect(mockPickPhoto).toHaveBeenCalled());
    await fireEvent.press(view.getByLabelText('Kaydet'));
    await waitFor(() => expect(mockSave).toHaveBeenCalled());
    expect(mockBack).not.toHaveBeenCalled();
    await view.unmount();
    expect(mockRemovePhoto).toHaveBeenCalledWith(NEW);
    expect(mockRemovePhoto).not.toHaveBeenCalledWith(OLD);
  });

  it('"Fotoğrafı kaldır" does not delete the saved file before saving', async () => {
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı kaldır'));
    expect(mockRemovePhoto).not.toHaveBeenCalled();
    await view.unmount();
    expect(mockRemovePhoto).not.toHaveBeenCalled();
  });

  it('removing then saving persists an empty photo', async () => {
    const view = await openExisting();
    await fireEvent.press(view.getByLabelText('Fotoğrafı kaldır'));
    await fireEvent.press(view.getByLabelText('Kaydet'));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ photoUri: '' })));
  });

  it('a new design whose photo is picked but never saved leaves no orphan file', async () => {
    mockDesigns = [];
    mockParams = { template: 'boho' };
    mockPickPhoto.mockResolvedValueOnce(NEW);
    const view = await render(<InvitationEditor />);
    await fireEvent.press(view.getByLabelText('Fotoğraf seç'));
    await waitFor(() => expect(mockPickPhoto).toHaveBeenCalledWith('new-design'));
    await view.unmount();
    expect(mockRemovePhoto).toHaveBeenCalledWith(NEW);
  });
});
