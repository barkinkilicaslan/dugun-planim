import { Linking, Share } from 'react-native';
import * as Contacts from 'expo-contacts';
import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';

import {
  accessFromPermission,
  getContactsAccess,
  loadContactCandidates,
  requestContactsAccess,
} from '@/services/contacts';
import { getDeviceCapabilities, sendInvite, sendInviteByWhatsApp } from '@/services/invite-sender';
import type { Guest } from '@/domain/models';
import { GUEST_DEFAULTS } from './fixtures';

jest.mock('expo-contacts', () => ({
  ContactField: {
    GIVEN_NAME: 'givenName',
    FAMILY_NAME: 'familyName',
    FULL_NAME: 'fullName',
    PHONES: 'phones',
    EMAILS: 'emails',
  },
  Contact: { getAllDetails: jest.fn(), presentAccessPicker: jest.fn() },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));
jest.mock('expo-sms', () => ({ isAvailableAsync: jest.fn(), sendSMSAsync: jest.fn() }));
jest.mock('expo-mail-composer', () => ({
  isAvailableAsync: jest.fn(),
  composeAsync: jest.fn(),
  MailComposerStatus: { SENT: 'sent', SAVED: 'saved', CANCELLED: 'cancelled', UNDETERMINED: 'undetermined' },
}));
jest.mock('@/services/invitation-files', () => ({ shareGeneratedFile: jest.fn() }));

const permission = (
  granted: boolean,
  status: string,
  canAskAgain = true,
  accessPrivileges?: 'all' | 'limited' | 'none',
) => ({
  granted,
  status,
  canAskAgain,
  expires: 'never',
  accessPrivileges,
});

const now = '2026-10-02T10:00:00.000Z';
const guest: Guest = {
  id: 'g1',
  name: 'Ayşe',
  phone: '0532 123 45 67',
  side: 'common',
  partySize: 1,
  childCount: 0,
  rsvp: 'pending',
  notes: '',
  mealNotes: '',
  group: 'other',
  ...GUEST_DEFAULTS,
  email: 'ayse@example.com',
  createdAt: now,
  updatedAt: now,
};

describe('contacts permission states', () => {
  it('maps granted, limited, denied, blocked and undetermined', () => {
    expect(accessFromPermission(permission(true, 'granted', true, 'all'))).toBe('granted');
    expect(accessFromPermission(permission(true, 'granted', true, 'limited'))).toBe('limited');
    expect(accessFromPermission(permission(false, 'denied', true))).toBe('denied');
    expect(accessFromPermission(permission(false, 'denied', false))).toBe('blocked');
    expect(accessFromPermission(permission(false, 'undetermined', true))).toBe('undetermined');
  });

  it('checking access never prompts; only the explicit request does', async () => {
    (Contacts.getPermissionsAsync as jest.Mock).mockResolvedValue(permission(false, 'undetermined'));
    await expect(getContactsAccess()).resolves.toBe('undetermined');
    expect(Contacts.requestPermissionsAsync).not.toHaveBeenCalled();
    (Contacts.requestPermissionsAsync as jest.Mock).mockResolvedValue(permission(false, 'denied', false));
    await expect(requestContactsAccess()).resolves.toBe('blocked');
    expect(Contacts.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('loads candidates only in memory and drops contacts without phone or email', async () => {
    (Contacts.Contact.getAllDetails as jest.Mock).mockResolvedValue([
      {
        id: '1',
        givenName: 'Ayşe',
        familyName: 'Demir',
        fullName: 'Ayşe Demir',
        phones: [{ id: 'p', number: '05321234567' }],
        emails: [],
      },
      { id: '2', givenName: 'Boş', phones: [], emails: [] },
    ]);
    const candidates = await loadContactCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ name: 'Ayşe Demir', phones: [{ display: '+90 532 123 45 67' }] });
  });
});

describe('invite sender', () => {
  const message = { subject: 'Konu', body: 'Metin' };

  it('reports device capabilities without sending anything', async () => {
    (MailComposer.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SMS.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await expect(getDeviceCapabilities()).resolves.toEqual({ mail: true, sms: false });
    expect(MailComposer.composeAsync).not.toHaveBeenCalled();
    expect(SMS.sendSMSAsync).not.toHaveBeenCalled();
  });

  it('SMS opens the system composer; "unknown" is reported as opened, "cancelled" is not recorded', async () => {
    (SMS.sendSMSAsync as jest.Mock).mockResolvedValueOnce({ result: 'unknown' });
    await expect(sendInvite('sms', guest, message)).resolves.toBe('opened');
    expect(SMS.sendSMSAsync).toHaveBeenCalledWith(['+905321234567'], 'Metin');
    (SMS.sendSMSAsync as jest.Mock).mockResolvedValueOnce({ result: 'cancelled' });
    await expect(sendInvite('sms', guest, message)).resolves.toBe('cancelled');
    (SMS.sendSMSAsync as jest.Mock).mockResolvedValueOnce({ result: 'sent' });
    await expect(sendInvite('sms', guest, message)).resolves.toBe('sent');
  });

  it('email opens the composer with one recipient and the PNG attachment', async () => {
    (MailComposer.composeAsync as jest.Mock).mockResolvedValue({ status: 'undetermined' });
    const attachment = { uri: 'file:///davetiye.png', mimeType: 'image/png' as const, filename: 'davetiye.png' };
    await expect(sendInvite('email', guest, { ...message, attachment })).resolves.toBe('opened');
    expect(MailComposer.composeAsync).toHaveBeenCalledWith({
      recipients: ['ayse@example.com'],
      subject: 'Konu',
      body: 'Metin',
      attachments: ['file:///davetiye.png'],
    });
    (MailComposer.composeAsync as jest.Mock).mockResolvedValue({ status: 'cancelled' });
    await expect(sendInvite('email', guest, message)).resolves.toBe('cancelled');
    await expect(sendInvite('email', { ...guest, email: '' }, message)).resolves.toBe('unavailable');
  });

  it('WhatsApp falls back to "unavailable" when the app cannot be opened', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined);
    await expect(sendInviteByWhatsApp(guest, 'Merhaba')).resolves.toBe('opened');
    expect(open).toHaveBeenCalledWith('whatsapp://send?phone=905321234567&text=Merhaba');
    open.mockRejectedValueOnce(new Error('Unable to open URL'));
    await expect(sendInviteByWhatsApp(guest, 'Merhaba')).resolves.toBe('unavailable');
    open.mockRestore();
  });

  it('share sheet dismissal is treated as cancelled', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValueOnce({ action: Share.dismissedAction });
    await expect(sendInvite('share', guest, message)).resolves.toBe('cancelled');
    share.mockResolvedValueOnce({ action: Share.sharedAction });
    await expect(sendInvite('share', guest, message)).resolves.toBe('opened');
    share.mockRestore();
  });
});
