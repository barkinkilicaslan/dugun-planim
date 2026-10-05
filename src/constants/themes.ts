import { Platform, type TextStyle } from 'react-native';

/**
 * Merkezi tema token'ları. Ekranlar renk, yazı tipi, köşe veya dekor değerini burada tanımlı token'lardan
 * okur (`useAppTheme()`); ekranlara sabit renk yazılmaz. Altı tema aynı ekranları ve bileşenleri paylaşır,
 * yalnızca token değerleri ve `layout` varyantları değişir.
 */
export const THEME_IDS = [
  'romantic-garden',
  'mediterranean-dream',
  'modern-elegance',
  'bohemian-sunset',
  'midnight-glamour',
  'wildflower-meadow',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export const DEFAULT_THEME_ID: ThemeId = 'romantic-garden';

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_IDS.some((id) => id === value);
}

export type MotifKind = 'floral' | 'waves' | 'lines' | 'sun' | 'stars' | 'wildflowers';
export type IconShape = 'circle' | 'squircle' | 'square' | 'arch';
/** Hero fotoğrafının çerçeve biçimi: yumuşak kemer, yuvarlak köşe, keskin, yaprak, altın çerçeveli, hap. */
export type PhotoShape = 'soft-arch' | 'rounded' | 'sharp' | 'leaf' | 'gilded' | 'pill';
export type ProgressStyle = 'bar' | 'segments' | 'line' | 'beads' | 'glow' | 'diamonds';
export type HeroVariant = 'arch-photo' | 'tile-banner' | 'monogram' | 'sunset-arc' | 'starry' | 'meadow';
export type MetricsVariant = 'cards' | 'tiles' | 'rules';
export type QuickVariant = 'icon-tiles' | 'pills' | 'rows';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  /** İkon kutusunun zemini ve içindeki simge. */
  iconBox: string;
  iconBoxText: string;
  progressTrack: string;
  progressFill: string;
  tabBar: string;
  tabBarActive: string;
  tabBarActiveBg: string;
  heroBackground: string;
  heroText: string;
  heroMuted: string;
  /** Hero içindeki dekoratif şekil renkleri (yalnızca süs; anlam taşımaz). */
  heroDecor: string;
  heroDecorAlt: string;
  shadow: string;
}

export interface ThemeTypeStyle {
  fontFamily?: string;
  fontWeight: NonNullable<TextStyle['fontWeight']>;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
}

export interface ThemeTypography {
  display: ThemeTypeStyle;
  heading: ThemeTypeStyle;
  body: ThemeTypeStyle;
  /** Küçük etiketlerin harf aralığı ve büyük harf kullanımı. */
  labelTracking: number;
  labelUppercase: boolean;
}

export interface ThemeShape {
  card: number;
  control: number;
  cardBorderWidth: number;
  iconBox: IconShape;
  photo: PhotoShape;
  progress: ProgressStyle;
  shadowOpacity: number;
  shadowRadius: number;
}

export interface ThemeLayout {
  hero: HeroVariant;
  metrics: MetricsVariant;
  quick: QuickVariant;
}

/**
 * Hero fotoğrafının üstündeki okunabilirlik katmanı. Katman soldan sağa solar: metnin durduğu sol bölgede
 * `strong`, çiftin göründüğü sağ uçta `weak` opaklık. Metin rengi `heroText`/`heroMuted`'dur.
 */
export interface ThemeHeroScrim {
  color: string;
  strong: number;
  weak: number;
}

export interface AppTheme {
  id: ThemeId;
  dark: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  shape: ThemeShape;
  layout: ThemeLayout;
  motif: MotifKind;
  heroScrim: ThemeHeroScrim;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;

const font = (ios: string, android: string, web: string) => Platform.select({ ios, android, default: web }) as string;

/** Sistem yazı tipleri; ek yazı tipi dosyası paketlenmez. Android'de eşdeğer genel ailelere düşülür. */
const FONTS = {
  georgia: font('Georgia', 'serif', 'Georgia, serif'),
  didot: font('Didot', 'serif', 'Didot, Georgia, serif'),
  baskerville: font('Baskerville', 'serif', 'Baskerville, Georgia, serif'),
  palatino: font('Palatino', 'serif', 'Palatino, Georgia, serif'),
  avenir: font('AvenirNext-DemiBold', 'sans-serif-medium', 'Avenir Next, system-ui, sans-serif'),
  optima: font('Optima-Bold', 'sans-serif-medium', 'Optima, system-ui, sans-serif'),
};

const romanticGarden: AppTheme = {
  id: 'romantic-garden',
  dark: false,
  motif: 'floral',
  colors: {
    background: '#FFF6F1',
    surface: '#FFFFFF',
    surfaceAlt: '#FBE7E3',
    primary: '#A3254F',
    primaryText: '#FFFFFF',
    secondary: '#E26D5C',
    secondaryText: '#3A0D14',
    accent: '#8E7CC3',
    accentSoft: '#ECE6F7',
    text: '#3A2530',
    muted: '#6B5560',
    border: '#EBD3CF',
    success: '#2F6B48',
    warning: '#8F5200',
    danger: '#A32424',
    iconBox: '#F9DAD7',
    iconBoxText: '#8E1F45',
    progressTrack: '#F4D9D5',
    progressFill: '#A3254F',
    tabBar: '#FFFFFF',
    tabBarActive: '#A3254F',
    tabBarActiveBg: '#FBE7E3',
    heroBackground: '#A3254F',
    heroText: '#FFFFFF',
    heroMuted: '#FDE8EC',
    heroDecor: '#F4A6A0',
    heroDecorAlt: '#B7C9A8',
    shadow: '#A3254F',
  },
  typography: {
    display: { fontFamily: FONTS.georgia, fontWeight: '700', fontStyle: 'italic' },
    heading: { fontFamily: FONTS.georgia, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 0.2,
    labelUppercase: false,
  },
  shape: {
    card: 24,
    control: 18,
    cardBorderWidth: 1,
    iconBox: 'circle',
    photo: 'soft-arch',
    progress: 'bar',
    shadowOpacity: 0.1,
    shadowRadius: 14,
  },
  heroScrim: { color: '#7A1740', strong: 0.9, weak: 0.06 },
  layout: { hero: 'arch-photo', metrics: 'cards', quick: 'icon-tiles' },
};

const mediterraneanDream: AppTheme = {
  id: 'mediterranean-dream',
  dark: false,
  motif: 'waves',
  colors: {
    background: '#F1F9FA',
    surface: '#FFFFFF',
    surfaceAlt: '#DDF1F3',
    primary: '#1F4FB5',
    primaryText: '#FFFFFF',
    secondary: '#0B7A83',
    secondaryText: '#FFFFFF',
    accent: '#F2B705',
    accentSoft: '#FFF1C2',
    text: '#14284B',
    muted: '#465B78',
    border: '#C2DFE5',
    success: '#1B7550',
    warning: '#8F4F00',
    danger: '#B3261E',
    iconBox: '#D9ECFA',
    iconBoxText: '#1B479F',
    progressTrack: '#CFE6EA',
    progressFill: '#0E8A94',
    tabBar: '#FFFFFF',
    tabBarActive: '#1F4FB5',
    tabBarActiveBg: '#DDE8FA',
    heroBackground: '#1F4FB5',
    heroText: '#FFFFFF',
    heroMuted: '#E3EEFF',
    heroDecor: '#3FC1C9',
    heroDecorAlt: '#F2B705',
    shadow: '#1F4FB5',
  },
  typography: {
    display: { fontFamily: FONTS.avenir, fontWeight: '700', letterSpacing: -0.4 },
    heading: { fontFamily: FONTS.avenir, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 0.6,
    labelUppercase: true,
  },
  shape: {
    card: 16,
    control: 12,
    cardBorderWidth: 1.5,
    iconBox: 'squircle',
    photo: 'rounded',
    progress: 'segments',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  heroScrim: { color: '#123C8C', strong: 0.88, weak: 0.05 },
  layout: { hero: 'tile-banner', metrics: 'tiles', quick: 'pills' },
};

const modernElegance: AppTheme = {
  id: 'modern-elegance',
  dark: false,
  motif: 'lines',
  colors: {
    background: '#FAF8F4',
    surface: '#FFFFFF',
    surfaceAlt: '#F0ECE4',
    primary: '#1A1A1A',
    primaryText: '#FFFFFF',
    secondary: '#8A6E32',
    secondaryText: '#FFFFFF',
    accent: '#B89B5E',
    accentSoft: '#F1E9D6',
    text: '#1A1A1A',
    muted: '#5C5851',
    border: '#D9D3C7',
    success: '#2B6144',
    warning: '#85500A',
    danger: '#A12B2B',
    iconBox: '#F0ECE4',
    iconBoxText: '#1A1A1A',
    progressTrack: '#DDD7CB',
    progressFill: '#1A1A1A',
    tabBar: '#FFFFFF',
    tabBarActive: '#1A1A1A',
    tabBarActiveBg: '#F0ECE4',
    heroBackground: '#FFFFFF',
    heroText: '#1A1A1A',
    heroMuted: '#4F4B45',
    heroDecor: '#B89B5E',
    heroDecorAlt: '#D9D3C7',
    shadow: '#000000',
  },
  typography: {
    display: { fontFamily: FONTS.didot, fontWeight: '400', letterSpacing: 1 },
    heading: { fontFamily: FONTS.didot, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 1.6,
    labelUppercase: true,
  },
  shape: {
    card: 4,
    control: 2,
    cardBorderWidth: 1,
    iconBox: 'square',
    photo: 'sharp',
    progress: 'line',
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  heroScrim: { color: '#FAF8F4', strong: 0.93, weak: 0 },
  layout: { hero: 'monogram', metrics: 'rules', quick: 'rows' },
};

const bohemianSunset: AppTheme = {
  id: 'bohemian-sunset',
  dark: false,
  motif: 'sun',
  colors: {
    background: '#FBF3E8',
    surface: '#FFFAF2',
    surfaceAlt: '#F3E2CC',
    primary: '#9C4126',
    primaryText: '#FFFFFF',
    secondary: '#E8A27C',
    secondaryText: '#4A2414',
    accent: '#6B7A3A',
    accentSoft: '#E6EAD0',
    text: '#3B2A20',
    muted: '#6A5242',
    border: '#E4CDB2',
    success: '#4F6B25',
    warning: '#8A4E00',
    danger: '#A3302A',
    iconBox: '#F6DCC4',
    iconBoxText: '#8A3820',
    progressTrack: '#EDD8BE',
    progressFill: '#9C4126',
    tabBar: '#FFFAF2',
    tabBarActive: '#9C4126',
    tabBarActiveBg: '#F6DCC4',
    heroBackground: '#9C4126',
    heroText: '#FFF8EE',
    heroMuted: '#F6DCC4',
    heroDecor: '#E8A27C',
    heroDecorAlt: '#D8B96A',
    shadow: '#7A3318',
  },
  typography: {
    display: { fontFamily: FONTS.palatino, fontWeight: '700', fontStyle: 'italic' },
    heading: { fontFamily: FONTS.palatino, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 0.8,
    labelUppercase: false,
  },
  shape: {
    card: 28,
    control: 22,
    cardBorderWidth: 1,
    iconBox: 'arch',
    photo: 'leaf',
    progress: 'beads',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  heroScrim: { color: '#4A2012', strong: 0.9, weak: 0.06 },
  layout: { hero: 'sunset-arc', metrics: 'cards', quick: 'icon-tiles' },
};

const midnightGlamour: AppTheme = {
  id: 'midnight-glamour',
  dark: true,
  motif: 'stars',
  colors: {
    background: '#0E1230',
    surface: '#181E45',
    surfaceAlt: '#232B5C',
    primary: '#E0BE72',
    primaryText: '#14183A',
    secondary: '#9B4F86',
    secondaryText: '#FFFFFF',
    accent: '#E0BE72',
    accentSoft: '#3A3560',
    text: '#F6F0E0',
    muted: '#C3BFD6',
    border: '#3B4580',
    success: '#7FD1A5',
    warning: '#F1BB72',
    danger: '#FF9E9E',
    iconBox: '#2B3470',
    iconBoxText: '#E0BE72',
    progressTrack: '#2B3470',
    progressFill: '#E0BE72',
    tabBar: '#121738',
    tabBarActive: '#E0BE72',
    tabBarActiveBg: '#2B3470',
    heroBackground: '#22174F',
    heroText: '#F6F0E0',
    heroMuted: '#D8D2EA',
    heroDecor: '#E0BE72',
    heroDecorAlt: '#9B4F86',
    shadow: '#000000',
  },
  typography: {
    display: { fontFamily: FONTS.baskerville, fontWeight: '700', letterSpacing: 0.6 },
    heading: { fontFamily: FONTS.baskerville, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 1.2,
    labelUppercase: true,
  },
  shape: {
    card: 14,
    control: 10,
    cardBorderWidth: 1,
    iconBox: 'squircle',
    photo: 'gilded',
    progress: 'glow',
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  heroScrim: { color: '#080C26', strong: 0.9, weak: 0.1 },
  layout: { hero: 'starry', metrics: 'tiles', quick: 'rows' },
};

const wildflowerMeadow: AppTheme = {
  id: 'wildflower-meadow',
  dark: false,
  motif: 'wildflowers',
  colors: {
    background: '#F5F9EC',
    surface: '#FFFFFF',
    surfaceAlt: '#E6F0D8',
    primary: '#2F6B3A',
    primaryText: '#FFFFFF',
    secondary: '#7B68B5',
    secondaryText: '#FFFFFF',
    accent: '#F2C94C',
    accentSoft: '#FFF3C4',
    text: '#22301F',
    muted: '#51614B',
    border: '#D0E0BE',
    success: '#2B6A3A',
    warning: '#8A5200',
    danger: '#A62B2B',
    iconBox: '#DCEBC8',
    iconBoxText: '#245A30',
    progressTrack: '#DCEBC8',
    progressFill: '#2F6B3A',
    tabBar: '#FFFFFF',
    tabBarActive: '#2F6B3A',
    tabBarActiveBg: '#E1EDCF',
    heroBackground: '#2F6B3A',
    heroText: '#FFF9E8',
    heroMuted: '#E3F1DA',
    heroDecor: '#F2C94C',
    heroDecorAlt: '#B7A8E6',
    shadow: '#2F6B3A',
  },
  typography: {
    display: { fontFamily: FONTS.optima, fontWeight: '700' },
    heading: { fontFamily: FONTS.optima, fontWeight: '700' },
    body: { fontWeight: '400' },
    labelTracking: 0.3,
    labelUppercase: false,
  },
  shape: {
    card: 20,
    control: 999,
    cardBorderWidth: 1,
    iconBox: 'circle',
    photo: 'pill',
    progress: 'diamonds',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  heroScrim: { color: '#1E4D2B', strong: 0.9, weak: 0.05 },
  layout: { hero: 'meadow', metrics: 'cards', quick: 'pills' },
};

export const THEMES: Record<ThemeId, AppTheme> = {
  'romantic-garden': romanticGarden,
  'mediterranean-dream': mediterraneanDream,
  'modern-elegance': modernElegance,
  'bohemian-sunset': bohemianSunset,
  'midnight-glamour': midnightGlamour,
  'wildflower-meadow': wildflowerMeadow,
};

export function getTheme(id: ThemeId): AppTheme {
  return THEMES[id];
}

/** Düğme biçimi için kullanılan köşe değeri; testlerde kısmi tema verilirse varsayılana düşer. */
export function controlRadius(theme: Partial<AppTheme>): number {
  return theme.shape?.control ?? radius.md;
}

export function cardRadius(theme: Partial<AppTheme>): number {
  return theme.shape?.card ?? radius.lg;
}

/** `#RRGGBB` rengine saydamlık ekler (0–1). Dekoratif katmanlar için. */
export function withAlpha(color: string, alpha: number): string {
  const hex = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${hex}`;
}
