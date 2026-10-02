import { guestSummary } from '@/domain/calculations';
import type { Guest } from '@/domain/models';
import {
  adultCount,
  applyManualRsvp,
  applyOnlineRsvp,
  clearInviteStatus,
  markInviteSent,
  matchesRsvpFilter,
  recordInviteOpened,
  rsvpSummary,
} from '@/domain/rsvp';
import { disabledRsvpProvider } from '@/domain/rsvp-provider';
import { rsvpUrlForGuest } from '@/services/rsvp';
import { GUEST_DEFAULTS } from './fixtures';

const created = '2026-10-01T10:00:00.000Z';
const now = '2026-10-02T10:00:00.000Z';
const guest = (overrides: Partial<Guest> = {}): Guest => ({
  id: 'g1',
  name: 'Aile',
  phone: '',
  side: 'common',
  partySize: 3,
  childCount: 1,
  rsvp: 'pending',
  notes: '',
  mealNotes: '',
  group: 'family',
  ...GUEST_DEFAULTS,
  createdAt: created,
  updatedAt: created,
  ...overrides,
});

describe('manual RSVP updates', () => {
  it('marks the source as manual and stamps the response date', () => {
    const updated = applyManualRsvp(guest(), 'attending', now);
    expect(updated).toMatchObject({ rsvp: 'attending', rsvpSource: 'manual', rsvpRespondedAt: now, updatedAt: now });
  });
  it('supports maybe and declined and always allows changing an online answer', () => {
    const online = guest({ rsvp: 'attending', rsvpSource: 'online', rsvpRespondedAt: created });
    expect(applyManualRsvp(online, 'maybe', now)).toMatchObject({ rsvp: 'maybe', rsvpSource: 'manual' });
    expect(applyManualRsvp(online, 'declined', now).rsvp).toBe('declined');
  });
  it('returning to pending clears the response metadata', () => {
    const answered = guest({ rsvp: 'attending', rsvpSource: 'manual', rsvpRespondedAt: created });
    expect(applyManualRsvp(answered, 'pending', now)).toMatchObject({
      rsvp: 'pending',
      rsvpSource: 'none',
      rsvpRespondedAt: '',
    });
  });
  it('returns the same object when nothing changes', () => {
    const current = guest();
    expect(applyManualRsvp(current, 'pending', now)).toBe(current);
  });
});

describe('online RSVP responses', () => {
  it('records source, adults and children', () => {
    const updated = applyOnlineRsvp(
      guest(),
      { status: 'attending', adults: 2, children: 1, note: 'Geç geliriz', respondedAt: created },
      now,
    );
    expect(updated).toMatchObject({
      rsvp: 'attending',
      rsvpSource: 'online',
      partySize: 3,
      childCount: 1,
      notes: 'Geç geliriz',
      rsvpRespondedAt: created,
    });
  });
  it('keeps the invited party size when declining', () => {
    const updated = applyOnlineRsvp(guest(), { status: 'declined', adults: 0, children: 0, respondedAt: created }, now);
    expect(updated).toMatchObject({ rsvp: 'declined', partySize: 3, childCount: 1 });
  });
});

describe('summary, counters and filters', () => {
  const guests = [
    guest({ id: '1', partySize: 3, childCount: 1, rsvp: 'attending', rsvpSource: 'manual' }),
    guest({ id: '2', partySize: 2, childCount: 0, rsvp: 'attending', rsvpSource: 'online' }),
    guest({ id: '3', partySize: 1, rsvp: 'pending', childCount: 0 }),
    guest({ id: '4', partySize: 2, rsvp: 'declined', childCount: 0, rsvpSource: 'manual' }),
    guest({ id: '5', partySize: 4, rsvp: 'maybe', childCount: 2, rsvpSource: 'manual', inviteStatus: 'opened' }),
  ];

  it('counts invitations and people per status', () => {
    expect(rsvpSummary(guests)).toMatchObject({
      invitations: 5,
      responded: 4,
      pending: 1,
      attending: 2,
      declined: 1,
      maybe: 1,
      attendingPeople: 5,
      attendingAdults: 4,
      attendingChildren: 1,
      pendingPeople: 1,
      declinedPeople: 2,
      maybePeople: 4,
      fromOnline: 1,
      invitesSent: 1,
    });
    expect(guestSummary(guests)).toMatchObject({ attending: 5, pending: 1, declined: 2, maybe: 4, people: 12 });
  });
  it('filters by status and by online source', () => {
    expect(guests.filter((item) => matchesRsvpFilter(item, 'maybe')).map((item) => item.id)).toEqual(['5']);
    expect(guests.filter((item) => matchesRsvpFilter(item, 'online')).map((item) => item.id)).toEqual(['2']);
    expect(guests.filter((item) => matchesRsvpFilter(item, 'all'))).toHaveLength(5);
    expect(adultCount(guests[0])).toBe(2);
  });
});

describe('invite dispatch state transitions', () => {
  it('records "opened" with channel and time, never claiming it was delivered', () => {
    const opened = recordInviteOpened(guest(), 'sms', now);
    expect(opened).toMatchObject({ inviteStatus: 'opened', lastInviteChannel: 'sms', lastInviteSentAt: now });
  });
  it('lets the user mark as sent and reset', () => {
    const opened = recordInviteOpened(guest(), 'whatsapp', now);
    const sent = markInviteSent(opened, now);
    expect(sent).toMatchObject({ inviteStatus: 'markedSent', lastInviteChannel: 'whatsapp' });
    expect(recordInviteOpened(sent, 'email', now).inviteStatus).toBe('markedSent');
    expect(clearInviteStatus(sent, now)).toMatchObject({
      inviteStatus: 'none',
      lastInviteChannel: '',
      lastInviteSentAt: '',
    });
  });
});

describe('online RSVP stays disabled until a backend is chosen', () => {
  it('never produces an RSVP link', async () => {
    expect(disabledRsvpProvider.isEnabled()).toBe(false);
    await expect(rsvpUrlForGuest('g1', { allowChildren: false })).resolves.toBeUndefined();
    await expect(disabledRsvpProvider.createInviteLink({ id: 'g1' }, { allowChildren: true })).rejects.toThrow();
    await expect(disabledRsvpProvider.fetchResponses()).resolves.toEqual([]);
  });
});
