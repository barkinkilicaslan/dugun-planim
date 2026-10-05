import type { ImageSourcePropType } from 'react-native';
import type { ThemeId } from '@/constants/themes';

/**
 * Tema başına hero görselleri. Metro dinamik `require` yollarını çözemez; bu yüzden her kaynak burada açıkça
 * yazılır. `require` yalnızca varlık kimliğini döndürür, görsel bir `Image` render edilene kadar belleğe alınmaz.
 *
 * - `hero`: ana sayfa için 1280×853 JPEG (orijinal 1536×1024 PNG `assets/themes/*-hero.png` pakete girmez).
 * - `thumb`: "Tarzını seç" kartları için 480×320 JPEG.
 * - `focal`: görselde çiftin bulunduğu nokta (0–1). Kırpma bu noktayı görünür tutacak biçimde yapılır.
 */
export interface ThemeImage {
  hero: ImageSourcePropType;
  thumb: ImageSourcePropType;
  heroSize: { width: number; height: number };
  thumbSize: { width: number; height: number };
  focal: { x: number; y: number };
}

const HERO_SIZE = { width: 1280, height: 853 } as const;
const THUMB_SIZE = { width: 480, height: 320 } as const;

export const THEME_IMAGES: Record<ThemeId, ThemeImage> = {
  'romantic-garden': {
    hero: require('../../assets/themes/optimized/romantic-garden-hero.jpg'),
    thumb: require('../../assets/themes/optimized/romantic-garden-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.88, y: 0.3 },
  },
  'mediterranean-dream': {
    hero: require('../../assets/themes/optimized/mediterranean-dream-hero.jpg'),
    thumb: require('../../assets/themes/optimized/mediterranean-dream-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.78, y: 0.4 },
  },
  'modern-elegance': {
    hero: require('../../assets/themes/optimized/modern-elegance-hero.jpg'),
    thumb: require('../../assets/themes/optimized/modern-elegance-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.85, y: 0.3 },
  },
  'bohemian-sunset': {
    hero: require('../../assets/themes/optimized/bohemian-sunset-hero.jpg'),
    thumb: require('../../assets/themes/optimized/bohemian-sunset-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.88, y: 0.35 },
  },
  'midnight-glamour': {
    hero: require('../../assets/themes/optimized/midnight-glamour-hero.jpg'),
    thumb: require('../../assets/themes/optimized/midnight-glamour-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.85, y: 0.25 },
  },
  'wildflower-meadow': {
    hero: require('../../assets/themes/optimized/wildflower-meadow-hero.jpg'),
    thumb: require('../../assets/themes/optimized/wildflower-meadow-thumb.jpg'),
    heroSize: HERO_SIZE,
    thumbSize: THUMB_SIZE,
    focal: { x: 0.88, y: 0.3 },
  },
};

/** Odak noktasını görünür tutan "cover" yerleşimi: görselin boyutu ve kutu içindeki konumu. */
export function coverPlacement(
  box: { width: number; height: number },
  image: { width: number; height: number },
  focal: { x: number; y: number },
): { width: number; height: number; left: number; top: number } {
  const scale = Math.max(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { width, height, left: -(width - box.width) * focal.x, top: -(height - box.height) * focal.y };
}
