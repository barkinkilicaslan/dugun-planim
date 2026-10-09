import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProvider, useApp } from '@/context/app-context';
import { repository } from '@/data/repository';
import { createInvitationDesign } from '@/domain/invitation-content';
import { TR } from './fixtures';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type InvitationDesign } from '@/domain/models';
import {
  abandonPhotoSession,
  clearPhoto,
  commitPhotoSession,
  pickPhoto,
  startPhotoSession,
} from '@/domain/photo-session';

const OLD = 'file:///docs/invitation-photos/d1-100.jpg';
const NEW = 'file:///docs/invitation-photos/d1-200.jpg';
const NEWER = 'file:///docs/invitation-photos/d1-300.jpg';
const now = '2026-10-02T10:00:00.000Z';

describe('photo session (pure rules)', () => {
  it('never discards the saved photo when a new one is picked', () => {
    const step = pickPhoto(startPhotoSession(OLD), NEW);
    expect(step.discard).toEqual([]);
    expect(step.session).toEqual({ current: NEW, pending: [NEW] });
  });
  it('discards a superseded unsaved pick but keeps the saved photo', () => {
    const first = pickPhoto(startPhotoSession(OLD), NEW);
    const second = pickPhoto(first.session, NEWER);
    expect(second.discard).toEqual([NEW]);
    expect(second.session).toEqual({ current: NEWER, pending: [NEWER] });
  });
  it('removing the saved photo only clears the form', () => {
    const step = clearPhoto(startPhotoSession(OLD));
    expect(step.discard).toEqual([]);
    expect(step.session.current).toBe('');
  });
  it('removing an unsaved pick discards just that file', () => {
    const picked = pickPhoto(startPhotoSession(OLD), NEW).session;
    expect(clearPhoto(picked).discard).toEqual([NEW]);
  });
  it('abandoning discards only unsaved files; committing keeps them', () => {
    const picked = pickPhoto(startPhotoSession(''), NEW).session;
    expect(abandonPhotoSession(picked)).toEqual([NEW]);
    expect(abandonPhotoSession(commitPhotoSession(picked))).toEqual([]);
  });
});

const mockRemovePhoto = jest.fn().mockResolvedValue(true);
const mockPickPhoto = jest.fn();
const mockSweep = jest.fn().mockResolvedValue(undefined);
const mockRemoveAllPhotos = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/invitation-photos', () => ({
  pickInvitationPhoto: (id: string) => mockPickPhoto(id),
  removeInvitationPhoto: (uri?: string) => mockRemovePhoto(uri),
  removeAllInvitationPhotos: () => mockRemoveAllPhotos(),
  removeUnreferencedInvitationPhotos: (uris: string[]) => mockSweep(uris),
}));
jest.mock('@/services/invitation-files', () => ({
  renderInvitationPdf: jest.fn(),
  renderInvitationPng: jest.fn(),
  shareGeneratedFile: jest.fn(),
  removeInvitationTempFiles: jest.fn(() => ({ removed: 0, failed: 0 })),
}));
jest.mock('@/services/notifications', () => ({
  clearAllNotifications: jest.fn().mockResolvedValue(undefined),
  getNotificationPermission: jest.fn().mockResolvedValue('denied'),
  cancelAllScheduledReminders: jest.fn().mockResolvedValue(undefined),
  cancelOrphanedReminders: jest.fn().mockResolvedValue(0),
  resetNotificationConsent: jest.fn().mockResolvedValue(undefined),
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));
jest.mock('@/data/repository', () => ({
  repository: {
    initialize: jest.fn().mockResolvedValue(undefined),
    load: jest.fn(),
    clearAll: jest.fn(),
    replaceAll: jest.fn(),
    upsertInvitationDesign: jest.fn(),
    deleteInvitationDesign: jest.fn(),
    setDefaultInvitationDesign: jest.fn(),
  },
}));

const profile = { ...EMPTY_PROFILE, couple1Name: 'Ada', couple2Name: 'Deniz', weddingDate: '2027-06-12' };
const designWithPhoto = (): InvitationDesign => ({
  ...createInvitationDesign('d1', 'boho', now, true, TR.t),
  photoUri: OLD,
});

describe('photo cleanup in the app context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
  beforeEach(() => {
    jest.clearAllMocks();
    (repository.load as jest.Mock).mockResolvedValue({
      ...EMPTY_APP_DATA,
      profile,
      invitationDesigns: [designWithPhoto()],
    });
  });

  it('deletes the previous photo only after the new design was saved', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let removedBeforePersist = false;
    (repository.upsertInvitationDesign as jest.Mock).mockImplementationOnce(async () => {
      removedBeforePersist = mockRemovePhoto.mock.calls.length > 0;
    });
    await act(async () => result.current.saveInvitationDesign({ ...designWithPhoto(), photoUri: NEW }));
    expect(removedBeforePersist).toBe(false);
    expect(mockRemovePhoto).toHaveBeenCalledWith(OLD);
    expect(mockRemovePhoto).not.toHaveBeenCalledWith(NEW);
  });

  it('keeps the old photo when saving fails', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    (repository.upsertInvitationDesign as jest.Mock).mockRejectedValueOnce(new Error('disk dolu'));
    await expect(
      act(async () => result.current.saveInvitationDesign({ ...designWithPhoto(), photoUri: NEW })),
    ).rejects.toThrow('disk dolu');
    expect(mockRemovePhoto).not.toHaveBeenCalled();
    expect(result.current.data.invitationDesigns[0].photoUri).toBe(OLD);
  });

  it('removing the photo and saving deletes the old file afterwards', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.saveInvitationDesign({ ...designWithPhoto(), photoUri: '' }));
    expect(mockRemovePhoto).toHaveBeenCalledWith(OLD);
  });

  it('saving without changing the photo deletes nothing', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.saveInvitationDesign({ ...designWithPhoto(), name: 'Yeni ad' }));
    expect(mockRemovePhoto).not.toHaveBeenCalled();
  });

  it('sweeps orphaned photo files at startup, keeping referenced ones', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(mockSweep).toHaveBeenCalledWith([OLD]));
  });

  it('deleting a design and deleting all data still clean photos; a restore removes photos no longer referenced', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.replaceAll({ ...EMPTY_APP_DATA, profile, invitationDesigns: [] }));
    expect(mockRemovePhoto).toHaveBeenCalledWith(OLD);
    await act(async () => result.current.clearAll());
    expect(mockRemoveAllPhotos).toHaveBeenCalled();
    await act(async () => result.current.deleteInvitationDesign('nope'));
  });

  it('deleting a design removes its photo', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.deleteInvitationDesign('d1'));
    expect(mockRemovePhoto).toHaveBeenCalledWith(OLD);
  });
});
