import { useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import { coverPlacement } from '@/constants/theme-images';
import { withAlpha } from '@/constants/themes';

/** Dekoratif görseller ekran okuyuculardan gizlenir; anlam taşıyan metin her zaman ayrı bileşenlerdedir. */
const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
  pointerEvents: 'none' as const,
};

/**
 * Kapsayıcıyı dolduran "cover" görsel. Kapsayıcı ölçüldükten sonra görsel, odak noktasını (çift) görünür tutacak
 * biçimde kaydırılır; ölçüm gelene kadar düz `cover` ile çizilir. Görsel sabit piksel boyutuyla verildiği için
 * kodlama belleği kapsayıcı boyutuyla sınırlı kalır.
 */
export function CoverImage({
  source,
  size,
  focal,
  testID,
}: {
  source: ImageSourcePropType;
  size: { width: number; height: number };
  focal: { x: number; y: number };
  testID?: string;
}) {
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const placement = box && box.width > 0 && box.height > 0 ? coverPlacement(box, size, focal) : null;
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current && current.width === width && current.height === height ? current : { width, height },
    );
  };
  return (
    <View {...HIDDEN} onLayout={onLayout} style={StyleSheet.absoluteFill}>
      <Image
        testID={testID}
        source={source}
        resizeMode="cover"
        fadeDuration={0}
        style={placement ? { position: 'absolute', ...placement } : StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** Soldan sağa solan okunabilirlik katmanı (gradyan kütüphanesi gerektirmeyen ince sütunlarla). */
export function SideScrim({
  color,
  strong,
  weak,
  plateau = 0.6,
  steps = 64,
}: {
  color: string;
  strong: number;
  weak: number;
  /** Katmanın tam yoğunlukta kaldığı oran (metin alanı). */
  plateau?: number;
  steps?: number;
}) {
  return (
    <View {...HIDDEN} style={[StyleSheet.absoluteFill, styles.row]}>
      {Array.from({ length: steps }, (_, index) => {
        const x = (index + 0.5) / steps;
        return (
          <View
            key={index}
            style={{ flex: 1, backgroundColor: withAlpha(color, scrimAlphaAt(strong, weak, x, plateau)) }}
          />
        );
      })}
    </View>
  );
}

/** Metnin okunacağı sol bölgedeki en az opaklık; testlerde en kötü durum kontrastı bu değerle hesaplanır. */
export function scrimAlphaAt(strong: number, weak: number, x: number, plateau = 0.6): number {
  if (x <= plateau) return strong;
  const t = (x - plateau) / (1 - plateau);
  const eased = t * t * (3 - 2 * t); // yumuşak geçiş: sütunlar arasında bant görünmesini azaltır
  return strong + (weak - strong) * eased;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' } });
