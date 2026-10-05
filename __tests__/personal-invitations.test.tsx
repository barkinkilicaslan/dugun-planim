import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProvider, useApp } from '@/context/app-context';
import { repository } from '@/data/repository';
import { createBackup, parseBackup } from '@/domain/backup';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type PersonalInvitation } from '@/domain/models';
import { validatePersonalInvitation } from '@/domain/validation';
import { EN, TR } from './fixtures';

const OLD = 'file:///docs/personal-invitations/p1-100.jpg';
const NEW = 'file:///docs/personal-invitations/p1-200.png';
const now = '2026-10-03T10:00:00.000Z';
const profile = { ...EMPTY_PROFILE, couple1Name: 'Ada', couple2Name: 'Deniz', weddingDate: '2027-06-12' };
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
const mockRemoveAll = jest.fn().mockResolvedValue(undefined);
const mockSweep = jest.fn().mockResolvedValue(undefined);
const mockPickLibrary = jest.fn();
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
    removeAllPersonalInvitationFiles: () => mockRemoveAll(),
    removeUnreferencedPersonalInvitationFiles: (uris: string[]) => mockSweep(uris),
  };
});
jest.mock('@/services/invitation-photos', () => ({
  pickInvitationPhoto: jest.fn(),
  removeInvitationPhoto: jest.fn().mockResolvedValue(true),
  removeAllInvitationPhotos: jest.fn().mockResolvedValue(undefined),
  removeUnreferencedInvitationPhotos: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/notifications', () => ({
  clearAllNotifications: jest.fn().mockResolvedValue(undefined),
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));
jest.mock('@/data/repository', () => ({
  repository: {
    initialize: jest.fn().mockResolvedValue(undefined),
    load: jest.fn(),
    clearAll: jest.fn().mockResolvedValue(undefined),
    replaceAll: jest.fn().mockResolvedValue(undefined),
    upsertPersonalInvitation: jest.fn().mockResolvedValue(undefined),
    deletePersonalInvitation: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('personal invitation data rules', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
  beforeEach(() => {
    jest.clearAllMocks();
    (repository.load as jest.Mock).mockResolvedValue({
      ...EMPTY_APP_DATA,
      profile,
      personalInvitations: [invitation()],
    });
  });

  it('loads saved invitations and sweeps orphaned files at startup (the image survives an app restart)', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.personalInvitations).toEqual([invitation()]);
    await waitFor(() => expect(mockSweep).toHaveBeenCalledWith([OLD]));
    expect(mockRemoveFile).not.toHaveBeenCalled();
  });

  it('adds a new invitation and persists it', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.savePersonalInvitation(invitation({ id: 'p2', imageUri: NEW })));
    expect(repository.upsertPersonalInvitation).toHaveBeenCalledWith(expect.objectContaining({ id: 'p2' }));
    expect(result.current.data.personalInvitations.map((item) => item.id).sort()).toEqual(['p1', 'p2']);
    expect(mockRemoveFile).not.toHaveBeenCalled();
  });

  it('replacing the image deletes the previous file only after the record was saved', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    let removedBeforePersist = false;
    (repository.upsertPersonalInvitation as jest.Mock).mockImplementationOnce(async () => {
      removedBeforePersist = mockRemoveFile.mock.calls.length > 0;
    });
    await act(async () => result.current.savePersonalInvitation(invitation({ imageUri: NEW })));
    expect(removedBeforePersist).toBe(false);
    expect(mockRemoveFile).toHaveBeenCalledWith(OLD);
    expect(mockRemoveFile).not.toHaveBeenCalledWith(NEW);
  });

  it('keeps the old file and record when saving fails', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    (repository.upsertPersonalInvitation as jest.Mock).mockRejectedValueOnce(new Error('disk dolu'));
    await expect(act(async () => result.current.savePersonalInvitation(invitation({ imageUri: NEW })))).rejects.toThrow(
      'disk dolu',
    );
    expect(mockRemoveFile).not.toHaveBeenCalled();
    expect(result.current.data.personalInvitations[0].imageUri).toBe(OLD);
  });

  it('renaming alone deletes no file', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.savePersonalInvitation(invitation({ name: 'Yeni ad' })));
    expect(mockRemoveFile).not.toHaveBeenCalled();
    expect(result.current.data.personalInvitations[0].name).toBe('Yeni ad');
  });

  it('deleting removes the record and the file', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.deletePersonalInvitation('p1'));
    expect(repository.deletePersonalInvitation).toHaveBeenCalledWith('p1');
    expect(mockRemoveFile).toHaveBeenCalledWith(OLD);
    expect(result.current.data.personalInvitations).toEqual([]);
  });

  it("a restore keeps this device's uploaded invitations; deleting all data removes them", async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.replaceAll({ ...EMPTY_APP_DATA, profile }));
    expect(result.current.data.personalInvitations).toEqual([invitation()]);
    expect(repository.replaceAll).toHaveBeenCalledWith(
      expect.objectContaining({ personalInvitations: [invitation()] }),
    );
    expect(mockRemoveFile).not.toHaveBeenCalled();
    await act(async () => result.current.clearAll());
    expect(mockRemoveAll).toHaveBeenCalled();
    expect(result.current.data.personalInvitations).toEqual([]);
  });

  it('validates name and image', () => {
    expect(validatePersonalInvitation(invitation({ name: '  Ad  ' })).name).toBe('Ad');
    expect(() => validatePersonalInvitation(invitation({ name: '   ' }))).toThrow();
    expect(() => validatePersonalInvitation(invitation({ name: 'x'.repeat(61) }))).toThrow();
    expect(() => validatePersonalInvitation(invitation({ imageUri: '' }))).toThrow();
  });
});

describe('JSON backup policy', () => {
  it('never writes uploaded invitations or their file paths into the backup', () => {
    const json = createBackup({ ...EMPTY_APP_DATA, profile, personalInvitations: [invitation()] });
    expect(json).not.toContain('personalInvitations');
    expect(json).not.toContain('personal-invitations');
    expect(json).not.toContain('Bahçe davetiyesi');
    expect(parseBackup(json).personalInvitations).toEqual([]);
  });

  it('ignores personal invitations smuggled into a backup file', () => {
    const envelope = JSON.parse(createBackup({ ...EMPTY_APP_DATA, profile }));
    envelope.payload.personalInvitations = [invitation({ imageUri: 'file:///elsewhere/secret.jpg' })];
    expect(parseBackup(JSON.stringify(envelope)).personalInvitations).toEqual([]);
  });
});

describe('copy in both languages', () => {
  it('has Turkish and English texts, including accessibility labels and error messages', () => {
    for (const { t } of [TR, EN]) {
      for (const key of [
        'home.personal.title',
        'home.personal.body',
        'home.personal.upload',
        'home.personal.uploadA11y',
        'personal.emptyTitle',
        'personal.emptyBody',
        'personal.localOnly',
        'personal.error.permission',
        'personal.error.badFormat',
        'personal.error.tooLarge',
        'personal.error.copy',
        'personal.error.fileMissing',
        'personal.error.shareTitle',
        'personal.share',
        'personal.sendToGuests',
        'personal.sendNeedsGuests',
        'personal.send.attachImage',
        'personal.send.noteEmail',
        'personal.imageMissing',
        'backup.photoNoticeBody',
      ] as const) {
        expect(t(key).length).toBeGreaterThan(10);
      }
    }
    expect(TR.t('home.personal.title')).toBe('Kendi davetiyeni yükle');
    expect(TR.t('personal.send.subtitle', { name: 'A' })).toBe('A · Yüklenen davetiye');
    expect(EN.t('personal.send.subtitle', { name: 'A' })).toBe('A · Uploaded invitation');
    expect(EN.t('home.personal.title')).toBe('Upload your own invitation');
    expect(TR.t('backup.photoNoticeBody')).toMatch(/Kendi davetiyeni yükle/);
    expect(EN.t('backup.photoNoticeBody')).toMatch(/Upload your own invitation/);
  });
});
