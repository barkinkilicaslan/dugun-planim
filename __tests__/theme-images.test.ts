import fs from 'fs';
import path from 'path';

import { scrimAlphaAt } from '@/components/theme/cover-image';
import { shouldLoadThumbnail } from '@/components/theme/lazy-visibility';
import { coverPlacement, THEME_IMAGES } from '@/constants/theme-images';
import { getTheme, THEME_IDS } from '@/constants/themes';

const ROOT = path.resolve(__dirname, '..');
const THEME_DIR = path.join(ROOT, 'assets/themes');

function luminance(hex: string): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const n = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
  return 0.2126 * channel(n(1)) + 0.7152 * channel(n(3)) + 0.0722 * channel(n(5));
}
const rgb = (hex: string) => [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16));
function lum(r: number, g: number, b: number) {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(a: number, b: number) {
  const [hi, lo] = [a, b].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Fotoğraf pikseli `pixel` (0–255 gri) üstüne `alpha` opaklıkta `scrim` rengi bindirilince oluşan renk. */
function composite(scrim: string, alpha: number, pixel: number): number {
  const [r, g, b] = rgb(scrim).map((channel) => channel * alpha + pixel * (1 - alpha));
  return lum(r, g, b);
}

/** JPEG başlığındaki (SOF) boyutları okur. */
function jpegSize(file: string): { width: number; height: number } {
  const buffer = fs.readFileSync(file);
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) throw new Error('geçersiz JPEG');
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    offset += 2 + length;
  }
  throw new Error('boyut bulunamadı');
}

describe('theme image map', () => {
  it('has a hero and a thumbnail for every theme', () => {
    expect(Object.keys(THEME_IMAGES).sort()).toEqual([...THEME_IDS].sort());
    for (const id of THEME_IDS) {
      expect(THEME_IMAGES[id].hero).toBeTruthy();
      expect(THEME_IMAGES[id].thumb).toBeTruthy();
    }
  });

  it.each(THEME_IDS)('%s maps to its own hero and thumbnail asset', (id) => {
    const hero = THEME_IMAGES[id].hero as { testUri: string };
    const thumb = THEME_IMAGES[id].thumb as { testUri: string };
    expect(hero.testUri).toMatch(new RegExp(`optimized/${id}-hero\\.jpg$`));
    expect(thumb.testUri).toMatch(new RegExp(`optimized/${id}-thumb\\.jpg$`));
  });

  it('never points two themes at the same asset', () => {
    const uris = THEME_IDS.flatMap((id) => [
      (THEME_IMAGES[id].hero as { testUri: string }).testUri,
      (THEME_IMAGES[id].thumb as { testUri: string }).testUri,
    ]);
    expect(new Set(uris).size).toBe(12);
  });

  it('keeps the original sources and ships small optimized copies', () => {
    for (const id of THEME_IDS) {
      const original = path.join(THEME_DIR, `${id}-hero.png`);
      const hero = path.join(THEME_DIR, 'optimized', `${id}-hero.jpg`);
      const thumb = path.join(THEME_DIR, 'optimized', `${id}-thumb.jpg`);
      expect(fs.existsSync(original)).toBe(true);
      expect(fs.statSync(hero).size).toBeLessThan(400_000);
      expect(fs.statSync(thumb).size).toBeLessThan(80_000);
      expect(fs.statSync(hero).size).toBeLessThan(fs.statSync(original).size / 5);
      expect(jpegSize(hero)).toEqual(THEME_IMAGES[id].heroSize);
      expect(jpegSize(thumb)).toEqual(THEME_IMAGES[id].thumbSize);
    }
  });

  it('uses no remote image URLs in the image map', () => {
    const source = fs.readFileSync(path.join(ROOT, 'src/constants/theme-images.ts'), 'utf8');
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/require\(\s*[`a-zA-Z]/); // yalnız sabit dize yolları
  });
});

describe('cover placement', () => {
  const image = { width: 1280, height: 853 };
  it('fills the box and keeps the focal point visible when cropping sideways', () => {
    const box = { width: 300, height: 400 };
    const placed = coverPlacement(box, image, { x: 0.9, y: 0.3 });
    expect(placed.width).toBeGreaterThanOrEqual(box.width);
    expect(placed.height).toBeGreaterThanOrEqual(box.height);
    // Odak noktası (görselin %90'ı) kutunun içinde kalır.
    const focalX = placed.left + placed.width * 0.9;
    expect(focalX).toBeGreaterThan(0);
    expect(focalX).toBeLessThan(box.width);
    expect(placed.left).toBeLessThanOrEqual(0);
    expect(placed.left + placed.width).toBeGreaterThanOrEqual(box.width);
  });
  it('does not shift an image that already fits the box exactly', () => {
    expect(coverPlacement({ width: 1280, height: 853 }, image, { x: 1, y: 1 })).toEqual({
      width: 1280,
      height: 853,
      left: -0,
      top: -0,
    });
  });
  it.each(THEME_IDS)('%s keeps the couple in view on a narrow hero', (id) => {
    const { focal, heroSize } = THEME_IMAGES[id];
    const box = { width: 398, height: 300 };
    const placed = coverPlacement(box, heroSize, focal);
    const coupleX = placed.left + placed.width * focal.x;
    expect(coupleX).toBeGreaterThan(box.width * 0.4);
    expect(coupleX).toBeLessThan(box.width);
  });
});

describe('hero text contrast over the photo (worst case: black or white pixels)', () => {
  it.each(THEME_IDS)('%s', (id) => {
    const theme = getTheme(id);
    // Metin sütunu hero genişliğinin %64'üne kadar uzanır.
    const alpha = scrimAlphaAt(theme.heroScrim.strong, theme.heroScrim.weak, 0.64);
    for (const pixel of [0, 255]) {
      const background = composite(theme.heroScrim.color, alpha, pixel);
      expect(contrastRatio(luminance(theme.colors.heroText), background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(luminance(theme.colors.heroMuted), background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('fades so the couple on the right stays visible', () => {
    for (const id of THEME_IDS) {
      const { strong, weak } = getTheme(id).heroScrim;
      expect(scrimAlphaAt(strong, weak, 0.9)).toBeLessThan(0.4);
      expect(scrimAlphaAt(strong, weak, 0.2)).toBe(strong);
    }
  });
});

describe('thumbnail loading window', () => {
  const base = { scrollY: 0, viewportHeight: 700 };
  it('loads only the first cards before positions are measured', () => {
    const loaded = [0, 1, 2, 3, 4, 5].filter((index) => shouldLoadThumbnail({ ...base, index }));
    expect(loaded).toEqual([0, 1, 2, 3]);
  });
  it('loads cards near the viewport and skips far ones', () => {
    expect(shouldLoadThumbnail({ ...base, index: 0, top: 100, height: 300 })).toBe(true);
    expect(shouldLoadThumbnail({ ...base, index: 5, top: 1600, height: 300 })).toBe(false);
    expect(shouldLoadThumbnail({ ...base, index: 5, top: 1600, height: 300, scrollY: 1000 })).toBe(true);
  });
  it('releases cards that have scrolled far away', () => {
    expect(shouldLoadThumbnail({ ...base, index: 0, top: 0, height: 300, scrollY: 1500 })).toBe(false);
  });
});
