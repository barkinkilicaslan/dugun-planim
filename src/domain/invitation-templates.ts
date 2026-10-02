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
  name: string;
  description: string;
  defaultPaletteId: string;
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
    name: 'Klasik',
    description: 'Çift çizgili çerçeve ve ince elmas ayraç.',
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
    name: 'Minimal',
    description: 'Geniş boşluklar, ince çizgi ve sade tipografi.',
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
    name: 'Botanik',
    description: 'Üstte yaprak dalı, altta yumuşak yeşil tonlar.',
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
    name: 'Modern',
    description: 'Kalın bant, sola hizalı büyük isimler.',
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
    name: 'Bohem',
    description: 'Toprak tonları, kemer biçimli fotoğraf alanı ve yapraklar.',
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
    name: 'Altın Zarafet',
    description: 'Koyu zemin üzerinde altın çerçeve ve köşe süsleri.',
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
    name: 'Kır Bahçesi',
    description: 'Papatya benzeri çiçekler ve sıcak, açık tonlar.',
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
    name: 'Geometrik',
    description: 'Üst üste binen halkalar ve köşeli çerçeve.',
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
    name: 'Gece',
    description: 'Koyu mavi zemin, yıldızlar ve altın vurgular.',
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
    name: 'Romantik',
    description: 'Pudra tonları, kalp süsü ve yuvarlak fotoğraf.',
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

export interface InvitationPalette {
  id: string;
  name: string;
  background: string;
  ink: string;
  accent: string;
  muted: string;
}

export const INVITATION_PALETTES: readonly InvitationPalette[] = [
  { id: 'burgundy', name: 'Bordo', background: '#FBF5EC', ink: '#4A1426', accent: '#6F1D3A', muted: '#7B6168' },
  { id: 'ink', name: 'Mürekkep', background: '#FFFFFF', ink: '#1F1F24', accent: '#55555E', muted: '#6B6B75' },
  { id: 'emerald', name: 'Zümrüt', background: '#F4F7F1', ink: '#1E3A2E', accent: '#3E7A5A', muted: '#58695F' },
  { id: 'navy', name: 'Lacivert', background: '#F5F7FB', ink: '#14233F', accent: '#2F5597', muted: '#5F6A82' },
  { id: 'terracotta', name: 'Kiremit', background: '#F8EEE3', ink: '#5A2E1C', accent: '#B2603C', muted: '#7D5F4E' },
  {
    id: 'blackGold',
    name: 'Siyah & altın',
    background: '#17140F',
    ink: '#F3E7C6',
    accent: '#C9A24E',
    muted: '#B8A98A',
  },
  { id: 'sage', name: 'Adaçayı', background: '#F6F4EA', ink: '#3B4631', accent: '#6B7F4C', muted: '#656D58' },
  { id: 'teal', name: 'Petrol', background: '#F1F7F7', ink: '#0F3B40', accent: '#1F8A8F', muted: '#55737A' },
  { id: 'midnight', name: 'Gece mavisi', background: '#0E1631', ink: '#EEF1FA', accent: '#D6B66A', muted: '#A7B0CC' },
  { id: 'blush', name: 'Pudra', background: '#FDF1F1', ink: '#5B2A33', accent: '#B35A70', muted: '#7F5C63' },
];

export function paletteById(id: string): InvitationPalette {
  return INVITATION_PALETTES.find((palette) => palette.id === id) ?? INVITATION_PALETTES[0];
}

export const DEFAULT_INVITATION_MESSAGE = 'Hayatımızın en özel gününde sizleri de aramızda görmekten mutluluk duyarız.';

export const ADULTS_ONLY_PRESETS: readonly string[] = [
  'Kutlamamızı yalnızca yetişkin misafirlerimizle gerçekleştireceğimizi anlayışla karşılamanızı rica ederiz.',
  'Düğünümüz yetişkinlere özeldir. Anlayışınız ve nezaketiniz için teşekkür ederiz.',
  'Bu özel gecede yalnızca yetişkin misafirlerimizi ağırlayabileceğiz; anlayışınız bizim için çok değerli.',
];
