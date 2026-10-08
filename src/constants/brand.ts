/**
 * Onaylı "Kurdele" markasının değişmeyen değerleri. Temalardan bağımsızdır: altı tema paleti değişse de marka
 * açılış görünümü ve ikon aynı kalır. Değerler `app.config.ts` içindeki açılış ekranı ayarlarıyla birebir aynı
 * olmak zorundadır (bkz. __tests__/brand-intro.test.tsx).
 */
export const BRAND = {
  name: 'Düğün Planım',
  coral: '#E9596C',
  ivory: '#FCF1E4',
} as const;

/** `app.config.ts` içindeki `expo-splash-screen` `imageWidth` değeri (pt). Açılış görünümü kurdeleyi aynı boyutta başlatır. */
export const NATIVE_SPLASH_IMAGE_WIDTH = 240;
