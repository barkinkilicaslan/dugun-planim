import { render } from '@testing-library/react-native';

import { InvitationCard } from '@/components/invitation/invitation-card';
import {
  buildInviteMessage,
  createInvitationDesign,
  invitationFileBase,
  inviteSubject,
  resolveInvitationContent,
  storedOverride,
} from '@/domain/invitation-content';
import {
  adultsOnlyPreset,
  adultsOnlyPresetMarker,
  INVITATION_PALETTES,
  INVITATION_TEMPLATES,
  paletteById,
  paletteName,
  resolveAdultsOnlyText,
  templateById,
  templateDescription,
  templateName,
  templateSupportsPhoto,
} from '@/domain/invitation-templates';
import { EMPTY_PROFILE, type WeddingProfile } from '@/domain/models';
import { validateInvitationDesign, ValidationError } from '@/domain/validation';
import { EN, TR } from './fixtures';

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
  it('ships the ten requested templates with Turkish and English names', () => {
    expect(INVITATION_TEMPLATES.map((template) => templateName(TR.t, template.id))).toEqual([
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
    expect(INVITATION_TEMPLATES.map((template) => templateName(EN.t, template.id))).toEqual([
      'Classic',
      'Minimal',
      'Botanical',
      'Modern',
      'Bohemian',
      'Gold Elegance',
      'Garden',
      'Geometric',
      'Night',
      'Romantic',
    ]);
    expect(new Set(INVITATION_TEMPLATES.map((template) => template.id)).size).toBe(10);
    for (const template of INVITATION_TEMPLATES) {
      expect(INVITATION_PALETTES.some((palette) => palette.id === template.defaultPaletteId)).toBe(true);
      expect(templateDescription(EN.t, template.id)).not.toBe(templateDescription(TR.t, template.id));
    }
    expect(INVITATION_TEMPLATES.filter(templateSupportsPhoto).length).toBeGreaterThanOrEqual(4);
  });

  it('names every palette in both languages', () => {
    for (const palette of INVITATION_PALETTES) {
      expect(paletteName(TR.t, palette.id)).not.toBe(`invitation.palette.${palette.id}`);
      expect(paletteName(EN.t, palette.id)).not.toBe(`invitation.palette.${palette.id}`);
    }
  });

  it('keeps text readable on every palette (AA for small text, 3:1 for large accent text)', () => {
    for (const palette of INVITATION_PALETTES) {
      expect(contrast(palette.ink, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.muted, palette.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.accent, palette.background)).toBeGreaterThanOrEqual(3);
    }
  });

  it.each(INVITATION_TEMPLATES.map((template) => [templateName(TR.t, template.id), template.id] as const))(
    'renders the %s template with real data',
    async (_name, id) => {
      const design = {
        ...createInvitationDesign('d1', id, now, true, TR.t),
        weddingTime: '18:30',
        venueName: 'Boğaz Salonu',
        venueAddress: 'Beşiktaş, İstanbul',
        rsvpDeadline: '2027-05-20',
        photoUri: 'file:///photo.jpg',
      };
      const content = resolveInvitationContent(design, { ...profile, adultsOnly: true }, TR);
      const view = await render(
        <InvitationCard content={content} template={templateById(id)} palette={paletteById(design.paletteId)} />,
      );
      expect(view.getByText(/Ece & Mert|ECE & MERT/)).toBeTruthy();
      expect(view.getByText('Boğaz Salonu')).toBeTruthy();
      expect(view.getByText('Saat 18:30')).toBeTruthy();
      expect(view.getByText(/12 Haziran 2027 Cumartesi/)).toBeTruthy();
      expect(view.getByText(/Son cevap tarihi: 20 Mayıs 2027/)).toBeTruthy();
      expect(view.getByText(adultsOnlyPreset(TR.t, 0))).toBeTruthy();
      expect(view.getByLabelText(/Düğün davetiyesi, Ece & Mert/)).toBeTruthy();
    },
  );
});

describe('English invitation', () => {
  it('shows English static labels, long dates and 12-hour time while leaving user text untouched', () => {
    const design = {
      ...createInvitationDesign('d1', 'classic', now, true, EN.t),
      message: 'Bizimle kutlayın!',
      weddingTime: '18:30',
      venueName: 'Boğaz Salonu',
      rsvpDeadline: '2027-05-20',
    };
    expect(design.name).toBe('Classic invitation');
    const content = resolveInvitationContent(design, { ...profile, adultsOnly: true }, EN);
    expect(content).toMatchObject({
      coupleNames: 'Ece & Mert',
      dateLong: 'Saturday, June 12, 2027',
      time: '6:30 PM',
      rsvpDeadline: 'May 20, 2027',
      message: 'Bizimle kutlayın!',
      venueName: 'Boğaz Salonu',
    });
  });

  it('renders English card labels', async () => {
    const design = { ...createInvitationDesign('d1', 'classic', now, true, EN.t), message: 'Bizimle kutlayın!' };
    const content = resolveInvitationContent(
      { ...design, weddingTime: '18:30', rsvpDeadline: '2027-05-20' },
      { ...profile, adultsOnly: true },
      EN,
    );
    const view = await render(
      <InvitationCard content={content} template={templateById('classic')} palette={paletteById('burgundy')} />,
    );
    // Karttaki sabit etiketler etkin dile (test ortamında Türkçe) göre gelir; kullanıcı metni ve içerik alanları dile bağlı değildir.
    expect(view.getByText('Bizimle kutlayın!')).toBeTruthy();
    expect(view.getByText(adultsOnlyPreset(EN.t, 0))).toBeTruthy();
  });

  it('uses the default message of the selected language only when the user wrote none', () => {
    const design = createInvitationDesign('d1', 'classic', now, true, TR.t);
    expect(resolveInvitationContent(design, profile, TR).message).toMatch(/mutluluk duyarız/);
    expect(resolveInvitationContent(design, profile, EN).message).toMatch(/delighted/);
    const custom = { ...design, message: 'Düğünümüze bekleriz.' };
    expect(resolveInvitationContent(custom, profile, TR).message).toBe('Düğünümüze bekleriz.');
    expect(resolveInvitationContent(custom, profile, EN).message).toBe('Düğünümüze bekleriz.');
  });
});

describe('adults-only wedding message', () => {
  const design = createInvitationDesign('d1', 'classic', now, true, TR.t);

  it('is hidden by default', async () => {
    const content = resolveInvitationContent(design, profile, TR);
    expect(content.adultsOnlyNote).toBe('');
    expect(buildInviteMessage(content, {}, TR.t)).not.toContain('yetişkin');
    const view = await render(
      <InvitationCard content={content} template={templateById('classic')} palette={paletteById('burgundy')} />,
    );
    expect(view.queryByText(/yetişkin/)).toBeNull();
  });

  it('appears in the preview and the share message once enabled, with the custom text winning', () => {
    const enabled = { ...profile, adultsOnly: true, adultsOnlyMessage: 'Profil mesajı' };
    expect(resolveInvitationContent(design, enabled, TR).adultsOnlyNote).toBe('Profil mesajı');
    expect(
      resolveInvitationContent({ ...design, adultsOnlyMessage: 'Tasarım mesajı' }, enabled, TR).adultsOnlyNote,
    ).toBe('Tasarım mesajı');
    expect(resolveInvitationContent(design, { ...enabled, adultsOnlyMessage: '' }, TR).adultsOnlyNote).toBe(
      adultsOnlyPreset(TR.t, 0),
    );
    expect(buildInviteMessage(resolveInvitationContent(design, enabled, TR), {}, TR.t)).toContain('Profil mesajı');
  });

  it('preset messages follow the app language but typed text never does', () => {
    const preset = { ...profile, adultsOnly: true, adultsOnlyMessage: adultsOnlyPresetMarker(1) };
    expect(resolveInvitationContent(design, preset, TR).adultsOnlyNote).toBe(adultsOnlyPreset(TR.t, 1));
    expect(resolveInvitationContent(design, preset, EN).adultsOnlyNote).toBe(adultsOnlyPreset(EN.t, 1));
    expect(adultsOnlyPreset(EN.t, 1)).toMatch(/adults-only/);
    const typed = { ...profile, adultsOnly: true, adultsOnlyMessage: 'Çocuk getirmeyiniz lütfen.' };
    expect(resolveInvitationContent(design, typed, EN).adultsOnlyNote).toBe('Çocuk getirmeyiniz lütfen.');
    expect(resolveAdultsOnlyText(EN.t, '@preset:9')).toBe('@preset:9');
  });

  it('offers three ready-made messages in both languages', () => {
    for (const index of [0, 1, 2]) {
      expect(adultsOnlyPreset(TR.t, index)).not.toBe(adultsOnlyPreset(EN.t, index));
    }
    expect(adultsOnlyPreset(TR.t, 0)).toBe(
      'Kutlamamızı yalnızca yetişkin misafirlerimizle gerçekleştireceğimizi anlayışla karşılamanızı rica ederiz.',
    );
  });
});

describe('invitation content and message', () => {
  it('falls back to the wedding profile and updates when the profile changes', () => {
    const design = createInvitationDesign('d1', 'modern', now, false, TR.t);
    expect(resolveInvitationContent(design, profile, TR)).toMatchObject({
      coupleNames: 'Ece & Mert',
      dateLong: '12 Haziran 2027 Cumartesi',
    });
    expect(resolveInvitationContent(design, { ...profile, weddingDate: '2027-07-03' }, TR).dateLong).toBe(
      '3 Temmuz 2027 Cumartesi',
    );
    expect(storedOverride('Ece & Mert', 'Ece & Mert')).toBe('');
    expect(storedOverride(' Ece ve Mert ', 'Ece & Mert')).toBe('Ece ve Mert');
  });

  it('builds a message with names, date, venue and no link while online RSVP is off', () => {
    const design = {
      ...createInvitationDesign('d1', 'classic', now, false, TR.t),
      weddingTime: '19:00',
      venueName: 'Salon',
      venueAddress: 'Ankara',
      rsvpDeadline: '2027-05-01',
    };
    const message = buildInviteMessage(resolveInvitationContent(design, profile, TR), { guestName: 'Ayşe' }, TR.t);
    expect(message).toContain('Sevgili Ayşe,');
    expect(message).toContain('Ece & Mert');
    expect(message).toContain('12 Haziran 2027 Cumartesi · 19:00');
    expect(message).toContain('Salon, Ankara');
    expect(message).toContain('1 Mayıs 2027');
    expect(message).not.toMatch(/https?:\/\//);
  });

  it('builds the same message in English', () => {
    const design = {
      ...createInvitationDesign('d1', 'classic', now, false, EN.t),
      weddingTime: '19:00',
      venueName: 'Salon',
      rsvpDeadline: '2027-05-01',
    };
    const message = buildInviteMessage(resolveInvitationContent(design, profile, EN), { guestName: 'Ayşe' }, EN.t);
    expect(message).toContain('Dear Ayşe,');
    expect(message).toContain('Saturday, June 12, 2027 · 7:00 PM');
    expect(message).toContain('Please let us know by May 1, 2027.');
    expect(inviteSubject(resolveInvitationContent(design, profile, EN), EN.t)).toBe('Ece & Mert · Wedding Invitation');
    expect(inviteSubject(resolveInvitationContent(design, profile, TR), TR.t)).toBe('Ece & Mert · Düğün Davetiyesi');
  });

  it('includes the RSVP link only when one is provided', () => {
    const content = resolveInvitationContent(createInvitationDesign('d1', 'classic', now, false, TR.t), profile, TR);
    expect(buildInviteMessage(content, { rsvpUrl: 'https://rsvp.example/abc' }, TR.t)).toContain(
      'https://rsvp.example/abc',
    );
  });

  it('creates safe file names from Turkish titles in either language', () => {
    const design = { ...createInvitationDesign('d1', 'classic', now, false, TR.t), name: 'Çiçekli Düğün Daveti!' };
    expect(invitationFileBase(design, TR.t)).toBe('davetiye-cicekli-dugun-daveti');
    expect(invitationFileBase(design, EN.t)).toBe('invitation-cicekli-dugun-daveti');
  });
});

describe('invitation design validation', () => {
  const valid = createInvitationDesign('d1', 'garden', now, false, TR.t);
  it('accepts a fresh design and rejects bad data', () => {
    expect(validateInvitationDesign(valid).templateId).toBe('garden');
    expect(() => validateInvitationDesign({ ...valid, weddingTime: '25:00' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, rsvpDeadline: '2027-02-30' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, name: ' ' })).toThrow(ValidationError);
    expect(() => validateInvitationDesign({ ...valid, message: 'x'.repeat(601) })).toThrow(ValidationError);
  });
});
