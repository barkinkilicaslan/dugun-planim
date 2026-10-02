import { render } from '@testing-library/react-native';

import { InvitationCard } from '@/components/invitation/invitation-card';
import {
  buildInviteMessage,
  createInvitationDesign,
  invitationFileBase,
  resolveInvitationContent,
  storedOverride,
} from '@/domain/invitation-content';
import {
  ADULTS_ONLY_PRESETS,
  INVITATION_PALETTES,
  INVITATION_TEMPLATES,
  paletteById,
  templateById,
  templateSupportsPhoto,
} from '@/domain/invitation-templates';
import { EMPTY_PROFILE, type WeddingProfile } from '@/domain/models';
import { validateInvitationDesign, ValidationError } from '@/domain/validation';

const now = '2026-10-02T10:00:00.000Z';
const profile: WeddingProfile = {
  ...EMPTY_PROFILE,
  couple1Name: 'Ece',
  couple2Name: 'Mert',
  weddingDate: '2027-06-12',
  onboardingCompleted: true,
};

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe('invitation templates', () => {
  it('ships the ten requested templates with unique ids and valid palettes', () => {
    expect(INVITATION_TEMPLATES.map((template) => template.name)).toEqual([
      'Klasik',
      'Minimal',
      'Botanik',
      'Modern',
      'Bohem',
      'Altın Zarafet',
      'Kır Bahçesi',
      'Geometrik',
      'Gece',
      'Romantik',
    ]);
    expect(new Set(INVITATION_TEMPLATES.map((template) => template.id)).size).toBe(10);
    for (const template of INVITATION_TEMPLATES) {
      expect(INVITATION_PALETTES.some((palette) => palette.id === template.defaultPaletteId)).toBe(true);
    }
    expect(INVITATION_TEMPLATES.filter(templateSupportsPhoto).length).toBeGreaterThanOrEqual(4);
  });

  it('keeps text readable on every palette (AA for small text, 3:1 for large accent text)', () => {
    for (const palette of INVITATION_PALETTES) {
      expect(contrast(palette.ink, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.muted, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.accent, palette.background)).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(INVITATION_TEMPLATES.map((template) => [template.name, template.id] as const))(
    'renders the %s template with real data',
    async (_name, id) => {
      const design = {
        ...createInvitationDesign('d1', id, now, true),
        weddingTime: '18:30',
        venueName: 'Boğaz Salonu',
        venueAddress: 'Beşiktaş, İstanbul',
        rsvpDeadline: '2027-05-20',
        photoUri: 'file:///photo.jpg',
      };
      const content = resolveInvitationContent(design, { ...profile, adultsOnly: true });
      const view = await render(
        <InvitationCard content={content} template={templateById(id)} palette={paletteById(design.paletteId)} />,
      );
      expect(view.getByText(/Ece & Mert|ECE & MERT/)).toBeTruthy();
      expect(view.getByText('Boğaz Salonu')).toBeTruthy();
      expect(view.getByText('Saat 18:30')).toBeTruthy();
      expect(view.getByText(/12 Haziran 2027 Cumartesi/)).toBeTruthy();
      expect(view.getByText(/Son cevap tarihi: 20 Mayıs 2027/)).toBeTruthy();
      expect(view.getByText(ADULTS_ONLY_PRESETS[0])).toBeTruthy();
      expect(view.getByLabelText(/Düğün davetiyesi, Ece & Mert/)).toBeTruthy();
    },
  );
});

describe('adults-only wedding message', () => {
  const design = createInvitationDesign('d1', 'classic', now, true);

  it('is hidden by default', async () => {
    const content = resolveInvitationContent(design, profile);
    expect(content.adultsOnlyNote).toBe('');
    expect(buildInviteMessage(content)).not.toContain('yetişkin');
    const view = await render(
      <InvitationCard content={content} template={templateById('classic')} palette={paletteById('burgundy')} />,
    );
    expect(view.queryByText(/yetişkin/)).toBeNull();
  });

  it('appears in the preview and the share message once enabled, with the custom text winning', () => {
    const enabled = { ...profile, adultsOnly: true, adultsOnlyMessage: 'Profil mesajı' };
    expect(resolveInvitationContent(design, enabled).adultsOnlyNote).toBe('Profil mesajı');
    expect(resolveInvitationContent({ ...design, adultsOnlyMessage: 'Tasarım mesajı' }, enabled).adultsOnlyNote).toBe(
      'Tasarım mesajı',
    );
    expect(resolveInvitationContent(design, { ...enabled, adultsOnlyMessage: '' }).adultsOnlyNote).toBe(
      ADULTS_ONLY_PRESETS[0],
    );
    expect(buildInviteMessage(resolveInvitationContent(design, enabled))).toContain('Profil mesajı');
  });
});

describe('invitation content and message', () => {
  it('falls back to the wedding profile and updates when the profile changes', () => {
    const design = createInvitationDesign('d1', 'modern', now, false);
    expect(resolveInvitationContent(design, profile)).toMatchObject({
      coupleNames: 'Ece & Mert',
      dateLong: '12 Haziran 2027 Cumartesi',
    });
    expect(resolveInvitationContent(design, { ...profile, weddingDate: '2027-07-03' }).dateLong).toBe(
      '3 Temmuz 2027 Cumartesi',
    );
    expect(storedOverride('Ece & Mert', 'Ece & Mert')).toBe('');
    expect(storedOverride(' Ece ve Mert ', 'Ece & Mert')).toBe('Ece ve Mert');
  });

  it('builds a message with names, date, venue and no link while online RSVP is off', () => {
    const design = {
      ...createInvitationDesign('d1', 'classic', now, false),
      weddingTime: '19:00',
      venueName: 'Salon',
      venueAddress: 'Ankara',
      rsvpDeadline: '2027-05-01',
    };
    const message = buildInviteMessage(resolveInvitationContent(design, profile), { guestName: 'Ayşe' });
    expect(message).toContain('Sevgili Ayşe,');
    expect(message).toContain('Ece & Mert');
    expect(message).toContain('12 Haziran 2027 Cumartesi · 19:00');
    expect(message).toContain('Salon, Ankara');
    expect(message).toContain('1 Mayıs 2027');
    expect(message).not.toMatch(/https?:\/\//);
  });

  it('includes the RSVP link only when one is provided', () => {
    const content = resolveInvitationContent(createInvitationDesign('d1', 'classic', now, false), profile);
    expect(buildInviteMessage(content, { rsvpUrl: 'https://rsvp.example/abc' })).toContain('https://rsvp.example/abc');
  });

  it('creates safe file names from Turkish titles', () => {
    expect(
      invitationFileBase({ ...createInvitationDesign('d1', 'classic', now, false), name: 'Çiçekli Düğün Daveti!' }),
    ).toBe('davetiye-cicekli-dugun-daveti');
  });
});

describe('invitation design validation', () => {
  const valid = createInvitationDesign('d1', 'garden', now, false);
  it('accepts a fresh design and rejects bad data', () => {
    expect(validateInvitationDesign(valid).templateId).toBe('garden');
    expect(() => validateInvitationDesign({ ...valid, weddingTime: '25:00' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, rsvpDeadline: '2027-02-30' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, name: ' ' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, message: 'x'.repeat(601) })).toThrow(ValidationError);
  });
});
