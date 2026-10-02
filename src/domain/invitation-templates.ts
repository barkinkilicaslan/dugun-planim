import type { Translator } from '@/i18n';
import type { InvitationTemplateId } from './models';

/**
 * Davetiye şablonları veri olarak tanımlanır; hepsi tek bir `InvitationCard` bileşeniyle çizilir.
 * Süslemeler (yaprak, çerçeve, yıldız, geometri) yalnızca bu projede çizilen basit şekillerden oluşur;
 * üçüncü taraf görsel, font veya şablon kullanılmaz.
 */

export type FrameStyle = 'doubleLine' | 'none' | 'corners' | 'inset' | 'arch' | 'geometric' | 'band';
export type OrnamentStyle = 'none' | 'leaves' | 'sprig' | 'diamond' | 'stars' | 'florets' | 'rings' | 'hearts';
export type DividerStyle = 'line' | 'diamond' | 'dots' | 'leaf' | 'none';
export type PhotoShape = 'circle' | 'arch' | 'rounded' | 'none';
export type TitleFont = 'serif' | 'sans' | 'serifItalic';

export interface InvitationTemplate {
  id: InvitationTemplateId;
  defaultPaletteId: PaletteId;
  frame: FrameStyle;
  ornament: OrnamentStyle;
  divider: DividerStyle;
  titleFont: TitleFont;
  uppercaseTitle: boolean;
  letterSpacing: number;
  align: 'center' | 'left';
  photoShape: PhotoShape;
}

export const INVITATION_TEMPLATES: readonly InvitationTemplate[] = [
  {
    id: 'classic',
    defaultPaletteId: 'burgundy',
    frame: 'doubleLine',
    ornament: 'diamond',
    divider: 'diamond',
    titleFont: 'serif',
    uppercaseTitle: false,
    letterSpacing: 1,
    align: 'center',
    photoShape: 'none',
  },
  {
    id: 'minimal',
    defaultPaletteId: 'ink',
    frame: 'none',
    ornament: 'none',
    divider: 'line',
    titleFont: 'sans',
    uppercaseTitle: true,
    letterSpacing: 4,
    align: 'center',
    photoShape: 'rounded',
  },
  {
    id: 'botanical',
    defaultPaletteId: 'emerald',
    frame: 'inset',
    ornament: 'sprig',
    divider: 'leaf',
    titleFont: 'serifItalic',
    uppercaseTitle: false,
    letterSpacing: 0.5,
    align: 'center',
    photoShape: 'none',
  },
  {
    id: 'modern',
    defaultPaletteId: 'navy',
    frame: 'band',
    ornament: 'none',
    divider: 'line',
    titleFont: 'sans',
    uppercaseTitle: true,
    letterSpacing: 2,
    align: 'left',
    photoShape: 'rounded',
  },
  {
    id: 'boho',
    defaultPaletteId: 'terracotta',
    frame: 'arch',
    ornament: 'leaves',
    divider: 'dots',
    titleFont: 'serifItalic',
    uppercaseTitle: false,
    letterSpacing: 0.5,
    align: 'center',
    photoShape: 'arch',
  },
  {
    id: 'goldElegance',
    defaultPaletteId: 'blackGold',
    frame: 'corners',
    ornament: 'diamond',
    divider: 'diamond',
    titleFont: 'serif',
    uppercaseTitle: true,
    letterSpacing: 3,
    align: 'center',
    photoShape: 'none',
  },
  {
    id: 'garden',
    defaultPaletteId: 'sage',
    frame: 'inset',
    ornament: 'florets',
    divider: 'dots',
    titleFont: 'serifItalic',
    uppercaseTitle: false,
    letterSpacing: 0.5,
    align: 'center',
    photoShape: 'circle',
  },
  {
    id: 'geometric',
    defaultPaletteId: 'teal',
    frame: 'geometric',
    ornament: 'rings',
    divider: 'line',
    titleFont: 'sans',
    uppercaseTitle: true,
    letterSpacing: 3,
    align: 'center',
    photoShape: 'none',
  },
  {
    id: 'night',
    defaultPaletteId: 'midnight',
    frame: 'inset',
    ornament: 'stars',
    divider: 'dots',
    titleFont: 'serif',
    uppercaseTitle: false,
    letterSpacing: 1.5,
    align: 'center',
    photoShape: 'circle',
  },
  {
    id: 'romantic',
    defaultPaletteId: 'blush',
    frame: 'doubleLine',
    ornament: 'hearts',
    divider: 'leaf',
    titleFont: 'serifItalic',
    uppercaseTitle: false,
    letterSpacing: 1,
    align: 'center',
    photoShape: 'circle',
  },
];

/** Davetiye kartının sabit mantıksal boyutu; PNG çıktısı bunun 3 katıdır (1080 × 1620 piksel). */
export const INVITATION_CARD_WIDTH = 360;
export const INVITATION_CARD_HEIGHT = 540;

export const INVITATION_TEMPLATE_IDS: readonly InvitationTemplateId[] = INVITATION_TEMPLATES.map(
  (template) => template.id,
);

export function templateById(id: InvitationTemplateId): InvitationTemplate {
  return INVITATION_TEMPLATES.find((template) => template.id === id) ?? INVITATION_TEMPLATES[0];
}

export function templateSupportsPhoto(template: InvitationTemplate): boolean {
  return template.photoShape !== 'none';
}

export type PaletteId =
  'burgundy' | 'ink' | 'emerald' | 'navy' | 'terracotta' | 'blackGold' | 'sage' | 'teal' | 'midnight' | 'blush';

export interface InvitationPalette {
  id: PaletteId;
  background: string;
  ink: string;
  accent: string;
  muted: string;
}

export const INVITATION_PALETTES: readonly InvitationPalette[] = [
  { id: 'burgundy', background: '#FBF5EC', ink: '#4A1426', accent: '#6F1D3A', muted: '#7B6168' },
  { id: 'ink', background: '#FFFFFF', ink: '#1F1F24', accent: '#55555E', muted: '#6B6B75' },
  { id: 'emerald', background: '#F4F7F1', ink: '#1E3A2E', accent: '#3E7A5A', muted: '#58695F' },
  { id: 'navy', background: '#F5F7FB', ink: '#14233F', accent: '#2F5597', muted: '#5F6A82' },
  { id: 'terracotta', background: '#F8EEE3', ink: '#5A2E1C', accent: '#B2603C', muted: '#7D5F4E' },
  {
    id: 'blackGold',
    background: '#17140F',
    ink: '#F3E7C6',
    accent: '#C9A24E',
    muted: '#B8A98A',
  },
  { id: 'sage', background: '#F6F4EA', ink: '#3B4631', accent: '#6B7F4C', muted: '#656D58' },
  { id: 'teal', background: '#F1F7F7', ink: '#0F3B40', accent: '#1F8A8F', muted: '#55737A' },
  { id: 'midnight', background: '#0E1631', ink: '#EEF1FA', accent: '#D6B66A', muted: '#A7B0CC' },
  { id: 'blush', background: '#FDF1F1', ink: '#5B2A33', accent: '#B35A70', muted: '#7F5C63' },
];

export function paletteById(id: string): InvitationPalette {
  return INVITATION_PALETTES.find((palette) => palette.id === id) ?? INVITATION_PALETTES[0];
}

export function templateName(t: Translator, id: InvitationTemplateId): string {
  return t(`invitation.template.${id}.name`);
}

export function templateDescription(t: Translator, id: InvitationTemplateId): string {
  return t(`invitation.template.${id}.description`);
}

export function paletteName(t: Translator, id: PaletteId): string {
  return t(`invitation.palette.${id}`);
}

export function defaultInvitationMessage(t: Translator): string {
  return t('invitation.defaultMessage');
}

export const ADULTS_ONLY_PRESET_COUNT = 3;

export function adultsOnlyPreset(t: Translator, index: number): string {
  const safe = Math.min(Math.max(Math.trunc(index), 0), ADULTS_ONLY_PRESET_COUNT - 1);
  return t(`invitation.adultsPreset${safe + 1}` as 'invitation.adultsPreset1');
}

/**
 * Hazır çocuksuz düğün mesajları metin olarak değil `@preset:N` işaretçisi olarak saklanır; böylece uygulama dili
 * değişince mesaj da yeni dile geçer. Kullanıcının yazdığı metin olduğu gibi saklanır ve asla çevrilmez.
 */
export function adultsOnlyPresetMarker(index: number): string {
  return `@preset:${index}`;
}

export function adultsOnlyPresetIndex(stored: string): number | undefined {
  const match = /^@preset:(\d+)$/.exec(stored.trim());
  if (!match) return undefined;
  const index = Number(match[1]);
  return index >= 0 && index < ADULTS_ONLY_PRESET_COUNT ? index : undefined;
}

export function resolveAdultsOnlyText(t: Translator, stored: string): string {
  const index = adultsOnlyPresetIndex(stored);
  return index === undefined ? stored.trim() : adultsOnlyPreset(t, index);
}
