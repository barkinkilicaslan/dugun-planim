import {
  availableChannels,
  buildWhatsAppUrl,
  cancelQueue,
  channelAvailability,
  createInviteQueue,
  currentEntry,
  queueFinished,
  queueSummary,
  resolveCurrent,
  smsRecipient,
} from '@/domain/invite-dispatch';
import type { Guest } from '@/domain/models';
import { EN, GUEST_DEFAULTS, TR } from './fixtures';

const now = '2026-10-02T10:00:00.000Z';
const guest = (id: string, overrides: Partial<Guest> = {}): Guest => ({
  id,
  name: `Davetli ${id}`,
  phone: '',
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
  ...overrides,
});

const fullDevice = { mail: true, sms: true };

describe('channel availability', () => {
  it('requires a usable email for email and a mail account on the device', () => {
    expect(channelAvailability(guest('a', { email: 'a@b.co' }), 'email', fullDevice).available).toBe(true);
    expect(channelAvailability(guest('a'), 'email', fullDevice)).toMatchObject({ available: false });
    const noMail = channelAvailability(guest('a', { email: 'a@b.co' }), 'email', { mail: false, sms: true });
    expect(noMail.reason).toBe('dispatch.noMailAccount');
    // Neden bir çeviri anahtarıdır; metin etkin dile göre arayüzde çevrilir.
    expect(noMail.reason && TR.t(noMail.reason)).toMatch(/e-posta hesabı/);
    expect(noMail.reason && EN.t(noMail.reason)).toMatch(/email account/);
  });
  it('requires a recognisable phone for SMS and WhatsApp', () => {
    const withPhone = guest('a', { phone: '0532 123 45 67' });
    expect(channelAvailability(withPhone, 'sms', fullDevice).available).toBe(true);
    expect(channelAvailability(withPhone, 'whatsapp', fullDevice).available).toBe(true);
    expect(channelAvailability(guest('a', { phone: 'abc' }), 'sms', fullDevice).available).toBe(false);
    expect(channelAvailability(withPhone, 'sms', { mail: true, sms: false }).available).toBe(false);
    expect(channelAvailability(withPhone, 'whatsapp', { ...fullDevice, whatsapp: false }).available).toBe(false);
  });
  it('always offers the system share sheet', () => {
    expect(channelAvailability(guest('a'), 'share', { mail: false, sms: false }).available).toBe(true);
    expect(availableChannels(guest('a'), { mail: false, sms: false }).map((item) => item.available)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });
});

describe('message links', () => {
  it('builds a WhatsApp link with a normalized number and encoded text', () => {
    expect(buildWhatsAppUrl('0532 123 45 67', 'Merhaba & hoş geldiniz')).toBe(
      'whatsapp://send?phone=905321234567&text=Merhaba%20%26%20ho%C5%9F%20geldiniz',
    );
    expect(buildWhatsAppUrl(undefined, 'Merhaba')).toBe('whatsapp://send?text=Merhaba');
  });
  it('normalizes SMS recipients', () => {
    expect(smsRecipient('0532 123 45 67')).toBe('+905321234567');
    expect(smsRecipient('abc')).toBeUndefined();
  });
});

describe('sequential invite queue', () => {
  const guests = [
    guest('a', { phone: '0532 111 22 33' }),
    guest('b'),
    guest('c', { phone: '0533 111 22 33' }),
    guest('d', { phone: '0534 111 22 33' }),
  ];

  it('skips guests without contact info up front and never auto-advances', () => {
    const queue = createInviteQueue(guests, 'sms', fullDevice);
    expect(queue.entries.map((entry) => entry.state)).toEqual(['waiting', 'skipped', 'waiting', 'waiting']);
    expect(queue.entries[1].reason).toBe('dispatch.noPhone');
    expect(currentEntry(queue)?.guestId).toBe('a');
  });

  it('advances only when the user resolves the current guest', () => {
    let queue = createInviteQueue(guests, 'sms', fullDevice);
    queue = resolveCurrent(queue, 'opened');
    expect(currentEntry(queue)?.guestId).toBe('c');
    queue = resolveCurrent(queue, 'skipped', 'dispatch.userSkipped');
    expect(currentEntry(queue)?.guestId).toBe('d');
    queue = resolveCurrent(queue, 'opened');
    expect(queueFinished(queue)).toBe(true);
    expect(queueSummary(queue)).toEqual({ opened: 2, skipped: 2, cancelled: 0, waiting: 0 });
  });

  it('cancelling stops the queue and leaves the remaining guests untouched', () => {
    let queue = createInviteQueue(guests, 'sms', fullDevice);
    queue = resolveCurrent(queue, 'opened');
    queue = cancelQueue(queue);
    expect(queueFinished(queue)).toBe(true);
    expect(currentEntry(queue)).toBeUndefined();
    expect(queueSummary(queue)).toMatchObject({ opened: 1, cancelled: 2 });
    expect(resolveCurrent(queue, 'opened')).toBe(queue);
  });

  it('is finished immediately when nobody can be reached on the channel', () => {
    const queue = createInviteQueue([guest('x')], 'email', fullDevice);
    expect(queueFinished(queue)).toBe(true);
    expect(queueSummary(queue).skipped).toBe(1);
  });
});
