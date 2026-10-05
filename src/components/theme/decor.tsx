import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import type { IconShape, MotifKind } from '@/constants/themes';
import { useAppTheme } from '@/context/theme-context';

/** Tüm dekoratif parçalar ekran okuyuculardan gizlenir; anlam taşımazlar. */
const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
  pointerEvents: 'none' as const,
};

function Petals({ size, color, center }: { size: number; color: string; center: string }) {
  const w = size * 0.26;
  const h = size * 0.42;
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: size / 2 - w / 2,
            top: size / 2 - h,
            width: w,
            height: h,
            borderRadius: w / 2,
            backgroundColor: color,
            opacity: 0.85,
            transformOrigin: '50% 100%',
            transform: [{ rotate: `${index * 60}deg` }],
          }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: size / 2 - size * 0.11,
          top: size / 2 - size * 0.11,
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size * 0.11,
          backgroundColor: center,
        }}
      />
    </>
  );
}

function Sparkle({ x, y, len, color }: { x: number; y: number; len: number; color: string }) {
  const bar = (rotate: string, length = len): ViewStyle => ({
    position: 'absolute',
    left: x - 1,
    top: y - length / 2,
    width: 2,
    height: length,
    borderRadius: 1,
    backgroundColor: color,
    transform: [{ rotate }],
  });
  return (
    <>
      <View style={bar('0deg')} />
      <View style={bar('90deg')} />
      <View style={[bar('45deg', len * 0.6), { opacity: 0.55 }]} />
    </>
  );
}

/** Saf `View` ile çizilen dekoratif motif; harici görsel veya SVG kullanmaz. */
export function Motif({
  kind,
  size = 96,
  color,
  altColor,
}: {
  kind: MotifKind;
  size?: number;
  color: string;
  altColor: string;
}) {
  const box = { width: size, height: size };
  if (kind === 'floral')
    return (
      <View {...HIDDEN} style={box}>
        <Petals size={size} color={color} center={altColor} />
      </View>
    );
  if (kind === 'waves')
    return (
      <View {...HIDDEN} style={[box, styles.waves]}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={[styles.waveRow, { marginLeft: row % 2 ? size / 8 : 0 }]}>
            {Array.from({ length: row % 2 ? 3 : 4 }, (_, i) => (
              <View
                key={i}
                style={{
                  width: size / 4,
                  height: size / 8,
                  borderBottomLeftRadius: size / 8,
                  borderBottomRightRadius: size / 8,
                  borderWidth: 2.5,
                  borderTopWidth: 0,
                  borderColor: row === 1 ? altColor : color,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  if (kind === 'lines')
    return (
      <View {...HIDDEN} style={[box, { justifyContent: 'center', gap: size * 0.1 }]}>
        <View style={{ height: 1, width: size, backgroundColor: color }} />
        <View style={{ height: 1, width: size * 0.65, backgroundColor: color, alignSelf: 'flex-end' }} />
        <View
          style={{
            width: size * 0.12,
            height: size * 0.12,
            backgroundColor: altColor,
            transform: [{ rotate: '45deg' }],
            alignSelf: 'center',
          }}
        />
        <View style={{ height: 1, width: size * 0.8, backgroundColor: color }} />
      </View>
    );
  if (kind === 'sun')
    return (
      <View {...HIDDEN} style={[box, { height: size / 2, overflow: 'hidden', alignItems: 'center' }]}>
        {[1, 0.72, 0.44].map((scale, i) => (
          <View
            key={scale}
            style={{
              position: 'absolute',
              top: size * (1 - scale) * 0.5,
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              backgroundColor: i === 2 ? altColor : 'transparent',
              borderWidth: i === 2 ? 0 : 3,
              borderColor: i === 0 ? color : altColor,
            }}
          />
        ))}
      </View>
    );
  if (kind === 'stars')
    return (
      <View {...HIDDEN} style={box}>
        <Sparkle x={size * 0.2} y={size * 0.25} len={size * 0.22} color={color} />
        <Sparkle x={size * 0.72} y={size * 0.15} len={size * 0.14} color={altColor} />
        <Sparkle x={size * 0.55} y={size * 0.5} len={size * 0.3} color={color} />
        <Sparkle x={size * 0.15} y={size * 0.78} len={size * 0.12} color={altColor} />
        <Sparkle x={size * 0.85} y={size * 0.82} len={size * 0.18} color={color} />
      </View>
    );
  return (
    <View {...HIDDEN} style={[box, { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }]}>
      {[0.7, 1, 0.55].map((height, i) => (
        <View key={i} style={{ height: size * height, alignItems: 'center', justifyContent: 'flex-start' }}>
          <View
            style={{
              width: size * 0.2,
              height: size * 0.2,
              borderRadius: size * 0.1,
              backgroundColor: i === 1 ? altColor : color,
              borderWidth: 3,
              borderColor: i === 1 ? color : altColor,
            }}
          />
          <View style={{ width: 2, flex: 1, backgroundColor: color, opacity: 0.8 }} />
        </View>
      ))}
    </View>
  );
}

export function iconBoxStyle(shape: IconShape, size: number): ViewStyle {
  const base: ViewStyle = { width: size, height: size, alignItems: 'center', justifyContent: 'center' };
  if (shape === 'circle') return { ...base, borderRadius: size / 2 };
  if (shape === 'squircle') return { ...base, borderRadius: size * 0.3 };
  if (shape === 'square') return { ...base, borderRadius: 2, borderWidth: 1 };
  return {
    ...base,
    borderTopLeftRadius: size / 2,
    borderTopRightRadius: size / 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  };
}

/** Küçük simge kutusu; biçimi (daire, yumuşak kare, kare, kemer) temadan gelir. */
export function IconBox({ glyph, size = 44 }: { glyph: string; size?: number }) {
  const theme = useAppTheme();
  const shape = theme.shape?.iconBox ?? 'circle';
  return (
    <View
      {...HIDDEN}
      style={[iconBoxStyle(shape, size), { backgroundColor: theme.colors.iconBox, borderColor: theme.colors.border }]}
    >
      <AppText
        color={theme.colors.iconBoxText}
        style={{ fontSize: size * 0.46, lineHeight: size * 0.6, fontWeight: '700' }}
        allowFontScaling={false}
      >
        {glyph}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  waves: { gap: 2 },
  waveRow: { flexDirection: 'row' },
});
