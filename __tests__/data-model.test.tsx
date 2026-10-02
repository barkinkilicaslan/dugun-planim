import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProvider, useApp } from '@/context/app-context';
import { repository } from '@/data/repository';
import { createBackup, parseBackup } from '@/domain/backup';
import { createInvitationDesign } from '@/domain/invitation-content';
import { EMPTY_APP_DATA, EMPTY_PROFILE, type Guest } from '@/domain/models';
import { validateGuest, ValidationError } from '@/domain/validation';
import { GUEST_DEFAULTS } from './fixtures';

jest.mock('@/data/repository', () => ({
  repository: {
    initialize: jest.fn().mockResolvedValue(undefined),
    load: jest.fn(),
    clearAll: jest.fn(),
    replaceAll: jest.fn(),
    saveProfile: jest.fn(),
    upsertInvitationDesign: jest.fn(),
    deleteInvitationDesign: jest.fn(),
    setDefaultInvitationDesign: jest.fn(),
    upsertGuest: jest.fn(),
  },
}));
jest.mock('@/services/notifications', () => ({
  clearAllNotifications: jest.fn().mockResolvedValue(undefined),
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));
const mockRemovePhoto = jest.fn().mockResolvedValue(undefined);
const mockRemoveAllPhotos = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/invitation-photos', () => ({
  removeInvitationPhoto: (uri?: string) => mockRemovePhoto(uri),
  removeAllInvitationPhotos: () => mockRemoveAllPhotos(),
}));

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
const guest: Guest = {
  id: 'g1',
  name: 'Ayşe',
  phone: '',
  side: 'common',
  partySize: 2,
  childCount: 1,
  rsvp: 'attending',
  notes: '',
  mealNotes: '',
  group: 'friends',
  ...GUEST_DEFAULTS,
  createdAt: now,
  updatedAt: now,
};

describe('guest validation', () => {
  it('accepts every RSVP status including maybe and normalizes email', () => {
    for (const rsvp of ['pending', 'attending', 'declined', 'maybe'] as const) {
      expect(validateGuest({ ...guest, rsvp }).rsvp).toBe(rsvp);
    }
    expect(validateGuest({ ...guest, email: ' Ayse@Example.COM ' }).email).toBe('ayse@example.com');
  });
  it('rejects unknown statuses and bad email', () => {
    expect(() => validateGuest({ ...guest, rsvp: 'yes' as never })).toThrow(ValidationError);
    expect(() => validateGuest({ ...guest, email: 'yok' })).toThrow('E-posta');
    expect(() => validateGuest({ ...guest, inviteStatus: 'sent' as never })).toThrow(ValidationError);
    expect(() => validateGuest({ ...guest, lastInviteChannel: 'fax' as never })).toThrow(ValidationError);
  });
});

describe('backups from older app versions', () => {
  it('restores a schema 2 backup (no email, RSVP metadata, adults-only or designs) with safe defaults', () => {
    const legacyGuest: Record<string, unknown> = { ...guest };
    for (const key of Object.keys(GUEST_DEFAULTS)) delete legacyGuest[key];
    const legacyProfile: Record<string, unknown> = { ...profile };
    delete legacyProfile.adultsOnly;
    delete legacyProfile.adultsOnlyMessage;
    const legacyPayload: Record<string, unknown> = {
      ...EMPTY_APP_DATA,
      profile: legacyProfile,
      guests: [legacyGuest, { ...legacyGuest, id: 'g2', rsvp: 'pending' }],
    };
    delete legacyPayload.invitationDesigns;
    const restored = parseBackup(
      JSON.stringify({
        format: 'dugun-planim-backup',
        schemaVersion: 2,
        appVersion: '1.0.0',
        exportedAt: now,
        payload: legacyPayload,
      }),
    );
    expect(restored.profile).toMatchObject({ adultsOnly: false, adultsOnlyMessage: '', weddingDate: '2027-06-12' });
    expect(restored.guests[0]).toMatchObject({
      email: '',
      rsvpSource: 'manual',
      inviteStatus: 'none',
      rsvp: 'attending',
    });
    expect(restored.guests[1]).toMatchObject({ rsvpSource: 'none' });
    expect(restored.invitationDesigns).toEqual([]);
  });

  it('round-trips adults-only settings and designs but never embeds the local photo path', () => {
    const design = { ...createInvitationDesign('d1', 'boho', now, true), photoUri: 'file:///private/photo.jpg' };
    const raw = createBackup({
      ...EMPTY_APP_DATA,
      profile: { ...profile, adultsOnly: true, adultsOnlyMessage: 'Yetişkinlere özel' },
      guests: [{ ...guest, email: 'a@b.co', rsvp: 'maybe', rsvpSource: 'manual' }],
      invitationDesigns: [design],
    });
    expect(raw).not.toContain('private/photo.jpg');
    const restored = parseBackup(raw);
    expect(restored.profile.adultsOnly).toBe(true);
    expect(restored.guests[0]).toMatchObject({ rsvp: 'maybe', email: 'a@b.co' });
    expect(restored.invitationDesigns).toHaveLength(1);
    expect(restored.invitationDesigns[0]).toMatchObject({ templateId: 'boho', photoUri: '', isDefault: true });
  });

  it('ignores a photo path in a hand-edited backup and restores the design without a photo', () => {
    const withPath = JSON.parse(
      createBackup({
        ...EMPTY_APP_DATA,
        profile,
        invitationDesigns: [createInvitationDesign('d1', 'night', now, true)],
      }),
    );
    withPath.payload.invitationDesigns[0].photoUri = 'file:///elsewhere/secret.jpg';
    expect(parseBackup(JSON.stringify(withPath)).invitationDesigns[0]).toMatchObject({
      templateId: 'night',
      photoUri: '',
    });
  });

  it('rejects two default invitations', () => {
    const a = createInvitationDesign('a', 'classic', now, true);
    const b = createInvitationDesign('b', 'night', now, true);
    expect(() => parseBackup(createBackup({ ...EMPTY_APP_DATA, profile, invitationDesigns: [a, b] }))).toThrow(
      'varsayılan',
    );
  });
});

describe('invitation design persistence in the app context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
  beforeEach(() => {
    jest.clearAllMocks();
    (repository.load as jest.Mock).mockResolvedValue({
      ...EMPTY_APP_DATA,
      profile,
      invitationDesigns: [
        { ...createInvitationDesign('d1', 'classic', now, true), photoUri: 'file:///x/invitation-photos/d1.jpg' },
        createInvitationDesign('d2', 'night', now, false),
      ],
    });
  });

  it('keeps exactly one default design', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.setDefaultInvitationDesign('d2'));
    expect(repository.setDefaultInvitationDesign).toHaveBeenCalledWith('d2');
    expect(result.current.data.invitationDesigns.filter((item) => item.isDefault).map((item) => item.id)).toEqual([
      'd2',
    ]);
  });

  it('saving a design as default demotes the previous default', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const edited = { ...result.current.data.invitationDesigns[1], name: 'Gece 2', isDefault: true };
    await act(async () => result.current.saveInvitationDesign(edited));
    expect(result.current.data.invitationDesigns.filter((item) => item.isDefault)).toHaveLength(1);
    expect(result.current.data.invitationDesigns.find((item) => item.id === 'd2')?.name).toBe('Gece 2');
  });

  it('deleting a design removes its stored photo; deleting all data removes every photo', async () => {
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.deleteInvitationDesign('d1'));
    expect(mockRemovePhoto).toHaveBeenCalledWith('file:///x/invitation-photos/d1.jpg');
    expect(result.current.data.invitationDesigns.map((item) => item.id)).toEqual(['d2']);
    await act(async () => result.current.clearAll());
    expect(mockRemoveAllPhotos).toHaveBeenCalled();
    expect(result.current.data.invitationDesigns).toEqual([]);
  });
});
