import { THEME_COPY } from '@/components/theme/theme-copy';
import {
  DEFAULT_THEME_ID,
  getTheme,
  isThemeId,
  THEME_IDS,
  THEMES,
  withAlpha,
  type ThemeColors,
} from '@/constants/themes';
import { createTranslator } from '@/i18n';

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const REQUIRED_COLORS: (keyof ThemeColors)[] = [
  'background',
  'surface',
  'surfaceAlt',
  'primary',
  'primaryText',
  'secondary',
  'secondaryText',
  'accent',
  'accentSoft',
  'text',
  'muted',
  'border',
  'success',
  'warning',
  'danger',
  'iconBox',
  'iconBoxText',
  'progressTrack',
  'progressFill',
  'tabBar',
  'tabBarActive',
  'tabBarActiveBg',
  'heroBackground',
  'heroText',
  'heroMuted',
  'heroDecor',
  'heroDecorAlt',
  'shadow',
];

describe('theme tokens', () => {
  it('defines exactly the six theme ids', () => {
    expect([...THEME_IDS]).toEqual([
      'romantic-garden',
      'mediterranean-dream',
      'modern-elegance',
      'bohemian-sunset',
      'midnight-glamour',
      'wildflower-meadow',
    ]);
    expect(Object.keys(THEMES).sort()).toEqual([...THEME_IDS].sort());
    expect(isThemeId('modern-elegance')).toBe(true);
    expect(isThemeId('dark')).toBe(false);
    expect(isThemeId(null)).toBe(false);
    expect(THEME_IDS).toContain(DEFAULT_THEME_ID);
  });

  describe.each(THEME_IDS)('%s', (id) => {
    const theme = getTheme(id);

    it('has every required token', () => {
      expect(theme.id).toBe(id);
      for (const key of REQUIRED_COLORS) expect(theme.colors[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.typography.display.fontWeight).toBeTruthy();
      expect(theme.typography.heading.fontWeight).toBeTruthy();
      expect(typeof theme.typography.labelTracking).toBe('number');
      expect(theme.shape.card).toBeGreaterThanOrEqual(0);
      expect(theme.shape.control).toBeGreaterThanOrEqual(0);
      expect(theme.shape.iconBox).toBeTruthy();
      expect(theme.shape.photo).toBeTruthy();
      expect(theme.shape.progress).toBeTruthy();
      expect(theme.layout.hero).toBeTruthy();
      expect(theme.layout.metrics).toBeTruthy();
      expect(theme.layout.quick).toBeTruthy();
      expect(theme.motif).toBeTruthy();
    });

    it('keeps body text and controls readable (WCAG AA 4.5:1)', () => {
      const c = theme.colors;
      const pairs: [string, string, string][] = [
        ['text on background', c.text, c.background],
        ['text on surface', c.text, c.surface],
        ['text on surfaceAlt', c.text, c.surfaceAlt],
        ['muted on background', c.muted, c.background],
        ['muted on surface', c.muted, c.surface],
        ['muted on surfaceAlt', c.muted, c.surfaceAlt],
        ['primaryText on primary', c.primaryText, c.primary],
        ['secondaryText on secondary', c.secondaryText, c.secondary],
        ['primary on surface', c.primary, c.surface],
        ['primary on background', c.primary, c.background],
        ['heroText on hero', c.heroText, c.heroBackground],
        ['heroMuted on hero', c.heroMuted, c.heroBackground],
        ['iconBoxText on iconBox', c.iconBoxText, c.iconBox],
        ['tabBarActive on tabBar', c.tabBarActive, c.tabBar],
        ['tabBarActive on tabBarActiveBg', c.tabBarActive, c.tabBarActiveBg],
        ['muted on tabBar', c.muted, c.tabBar],
        ['success on surface', c.success, c.surface],
        ['warning on surface', c.warning, c.surface],
        ['danger on surface', c.danger, c.surface],
        ['success on surfaceAlt', c.success, c.surfaceAlt],
        ['warning on surfaceAlt', c.warning, c.surfaceAlt],
      ];
      const failing = pairs
        .filter(([, fg, bg]) => contrast(fg, bg) < 4.5)
        .map(([name, fg, bg]) => `${name} ${contrast(fg, bg).toFixed(2)}`);
      expect(failing).toEqual([]);
      // Düğme gövdesi/ilerleme dolgusu gibi grafik öğeler için en az 3:1 (WCAG 1.4.11).
      expect(contrast(c.progressFill, c.progressTrack)).toBeGreaterThanOrEqual(3);
      expect(contrast(c.progressFill, c.surface)).toBeGreaterThanOrEqual(3);
    });

    it('has Turkish and English name and description', () => {
      for (const locale of ['tr', 'en'] as const) {
        const t = createTranslator(locale);
        expect(t(THEME_COPY[id].name).length).toBeGreaterThan(2);
        expect(t(THEME_COPY[id].description).length).toBeGreaterThan(10);
      }
    });
  });

  it('only Midnight Glamour is a dark theme', () => {
    expect(THEME_IDS.filter((id) => getTheme(id).dark)).toEqual(['midnight-glamour']);
  });

  it('themes differ in composition, not only in colour', () => {
    const themes = THEME_IDS.map(getTheme);
    for (const pick of [
      (t: (typeof themes)[number]) => t.layout.hero,
      (t: (typeof themes)[number]) => t.shape.progress,
      (t: (typeof themes)[number]) => t.shape.photo,
      (t: (typeof themes)[number]) => t.motif,
    ])
      expect(new Set(themes.map(pick)).size).toBe(6);
    expect(new Set(themes.map((t) => t.shape.iconBox)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(themes.map((t) => t.layout.metrics)).size).toBe(3);
    expect(new Set(themes.map((t) => t.layout.quick)).size).toBe(3);
    expect(new Set(themes.map((t) => t.shape.card)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(themes.map((t) => t.typography.display.fontFamily)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(themes.map((t) => t.colors.primary)).size).toBe(6);
  });

  it('adds alpha to a hex colour', () => {
    expect(withAlpha('#FFFFFF', 0.5)).toBe('#FFFFFF80');
    expect(withAlpha('#000000', 2)).toBe('#000000ff');
  });
});
