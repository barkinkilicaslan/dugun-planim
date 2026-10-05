import type { ThemeId } from '@/constants/themes';
import type { MessageKey } from '@/i18n';

/** Tema adı ve kısa açıklamasının çeviri anahtarları. */
export const THEME_COPY: Record<ThemeId, { name: MessageKey; description: MessageKey }> = {
  'romantic-garden': { name: 'style.romantic-garden.name', description: 'style.romantic-garden.desc' },
  'mediterranean-dream': { name: 'style.mediterranean-dream.name', description: 'style.mediterranean-dream.desc' },
  'modern-elegance': { name: 'style.modern-elegance.name', description: 'style.modern-elegance.desc' },
  'bohemian-sunset': { name: 'style.bohemian-sunset.name', description: 'style.bohemian-sunset.desc' },
  'midnight-glamour': { name: 'style.midnight-glamour.name', description: 'style.midnight-glamour.desc' },
  'wildflower-meadow': { name: 'style.wildflower-meadow.name', description: 'style.wildflower-meadow.desc' },
};
