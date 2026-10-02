import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { DividerStyle, FrameStyle, OrnamentStyle } from '@/domain/invitation-templates';

/**
 * Davetiye süslemeleri yalnızca View şekillerinden oluşur (yaprak, çiçek, kalp, halka, elmas). Hepsi bu projeye
 * özgündür; harici görsel, ikon seti veya font gerektirmez ve PNG/PDF çıktısında aynı görünür.
 */

export function Leaf({
  size = 24,
  color,
  rotate = 0,
  style,
}: {
  size?: number;
  color: string;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const height = size / 2;
  return (
    <View
      style={[
        {
          width: size,
          height,
          backgroundColor: color,
          borderTopLeftRadius: height,
          borderBottomRightRadius: height,
          transform: [{ rotate: `${rotate}deg` }],
        },
        style,
      ]}
    />
  );
}

export function Diamond({ size = 10, color, filled = true }: { size?: number; color: string; filled?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: filled ? color : 'transparent',
        borderWidth: filled ? 0 : 1,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}

function Dot({ size = 5, color }: { size?: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

function Sprig({ color, secondary }: { color: string; secondary: string }) {
  const leaves = [0, 1, 2, 3, 4];
  return (
    <View style={styles.sprig}>
      <View style={[styles.stem, { backgroundColor: color }]} />
      {leaves.map((index) => (
        <View key={index} style={[styles.sprigLeaf, { left: 14 + index * 26 }]}>
          <Leaf size={20} color={index % 2 ? color : secondary} rotate={-35} style={styles.leafUp} />
          <Leaf size={20} color={index % 2 ? secondary : color} rotate={35} style={styles.leafDown} />
        </View>
      ))}
    </View>
  );
}

function FanLeaves({ color, secondary }: { color: string; secondary: string }) {
  return (
    <View style={styles.fan}>
      <Leaf size={44} color={secondary} rotate={-50} style={styles.fanLeft} />
      <Leaf size={52} color={color} rotate={-90} style={styles.fanCenter} />
      <Leaf size={44} color={secondary} rotate={-130} style={styles.fanRight} />
    </View>
  );
}

function Flower({ petal, center }: { petal: string; center: string }) {
  return (
    <View style={styles.flower}>
      {[0, 45, 90, 135].map((angle) => (
        <View key={angle} style={[styles.petalBox, { transform: [{ rotate: `${angle}deg` }] }]}>
          <View style={[styles.petal, { backgroundColor: petal }]} />
          <View style={[styles.petal, styles.petalBottom, { backgroundColor: petal }]} />
        </View>
      ))}
      <View style={[styles.flowerCenter, { backgroundColor: center }]} />
    </View>
  );
}

function Heart({ color, size = 22 }: { color: string; size?: number }) {
  const width = size * 0.55;
  const piece = { width, height: size, borderRadius: width / 2, backgroundColor: color };
  return (
    <View style={{ width: size * 1.1, height: size * 1.05 }}>
      <View style={[piece, { position: 'absolute', left: size * 0.05, transform: [{ rotate: '-45deg' }] }]} />
      <View style={[piece, { position: 'absolute', left: size * 0.5, transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
}

const STARS: readonly (readonly [number, number, number])[] = [
  [18, 14, 3],
  [62, 40, 2],
  [120, 10, 4],
  [180, 34, 2],
  [236, 12, 3],
  [292, 38, 2],
  [330, 14, 3],
  [90, 52, 2],
  [210, 54, 3],
];

function Stars({ color, secondary }: { color: string; secondary: string }) {
  return (
    <View style={styles.stars}>
      {STARS.map(([x, y, size], index) => (
        <View key={`${x}-${y}`} style={{ position: 'absolute', left: x, top: y }}>
          {index % 3 === 0 ? <Diamond size={size * 2.2} color={secondary} /> : <Dot size={size * 1.6} color={color} />}
        </View>
      ))}
    </View>
  );
}

function Rings({ color }: { color: string }) {
  const ring = { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: color };
  return (
    <View style={styles.rings}>
      <View style={[ring, { position: 'absolute', left: 0 }]} />
      <View style={[ring, { position: 'absolute', left: 26 }]} />
    </View>
  );
}

export function TopOrnament({ kind, color, secondary }: { kind: OrnamentStyle; color: string; secondary: string }) {
  switch (kind) {
    case 'none':
      return null;
    case 'sprig':
      return <Sprig color={color} secondary={secondary} />;
    case 'leaves':
      return <FanLeaves color={color} secondary={secondary} />;
    case 'florets':
      return (
        <View style={styles.row}>
          <Flower petal={secondary} center={color} />
          <Flower petal={color} center={secondary} />
          <Flower petal={secondary} center={color} />
        </View>
      );
    case 'hearts':
      return (
        <View style={styles.row}>
          <Heart color={secondary} size={14} />
          <Heart color={color} size={24} />
          <Heart color={secondary} size={14} />
        </View>
      );
    case 'stars':
      return <Stars color={color} secondary={secondary} />;
    case 'rings':
      return <Rings color={color} />;
    case 'diamond':
      return (
        <View style={styles.row}>
          <Diamond size={7} color={secondary} />
          <Diamond size={12} color={color} />
          <Diamond size={7} color={secondary} />
        </View>
      );
  }
}

export function DividerOrnament({ kind, color }: { kind: DividerStyle; color: string }) {
  if (kind === 'none') return null;
  if (kind === 'line') return <View style={[styles.line, { backgroundColor: color, width: 64 }]} />;
  if (kind === 'dots')
    return (
      <View style={styles.row}>
        <Dot color={color} />
        <Dot size={7} color={color} />
        <Dot color={color} />
      </View>
    );
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: color, width: 36 }]} />
      {kind === 'diamond' ? <Diamond size={8} color={color} /> : <Leaf size={18} color={color} rotate={-20} />}
      <View style={[styles.line, { backgroundColor: color, width: 36 }]} />
    </View>
  );
}

/** Çerçeve katmanı: kartın tamamını kaplar ve dokunmaları engellemez. */
export function FrameLayer({ kind, color, secondary }: { kind: FrameStyle; color: string; secondary: string }) {
  switch (kind) {
    case 'none':
      return null;
    case 'doubleLine':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.frameOuter, { borderColor: color }]} />
          <View style={[styles.frameInner, { borderColor: secondary }]} />
        </View>
      );
    case 'inset':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.inset, { borderColor: color }]} />
        </View>
      );
    case 'arch':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.arch, { borderColor: color }]} />
        </View>
      );
    case 'geometric':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.frameOuter, { borderColor: color, borderRadius: 0 }]} />
          {[styles.cornerTl, styles.cornerTr, styles.cornerBl, styles.cornerBr].map((position, index) => (
            <View key={index} style={[styles.cornerDiamond, position]}>
              <Diamond size={14} color={secondary} />
            </View>
          ))}
        </View>
      );
    case 'corners':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View
            style={[styles.bracket, styles.cornerTl, { borderTopWidth: 2, borderLeftWidth: 2, borderColor: color }]}
          />
          <View
            style={[styles.bracket, styles.cornerTr, { borderTopWidth: 2, borderRightWidth: 2, borderColor: color }]}
          />
          <View
            style={[styles.bracket, styles.cornerBl, { borderBottomWidth: 2, borderLeftWidth: 2, borderColor: color }]}
          />
          <View
            style={[styles.bracket, styles.cornerBr, { borderBottomWidth: 2, borderRightWidth: 2, borderColor: color }]}
          />
          <View style={[styles.inset, { borderColor: secondary, opacity: 0.45 }]} />
        </View>
      );
    case 'band':
      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.band, { backgroundColor: color }]} />
          <View style={[styles.bandBottom, { backgroundColor: secondary }]} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  line: { height: 1.5 },
  sprig: { width: 150, height: 44 },
  stem: { position: 'absolute', left: 6, right: 6, top: 21, height: 1.5 },
  sprigLeaf: { position: 'absolute', top: 0, width: 20, height: 44 },
  leafUp: { position: 'absolute', top: 4, left: 0 },
  leafDown: { position: 'absolute', top: 26, left: 0 },
  fan: { width: 140, height: 60 },
  fanLeft: { position: 'absolute', left: 12, top: 18 },
  fanCenter: { position: 'absolute', left: 44, top: 6 },
  fanRight: { position: 'absolute', left: 84, top: 18 },
  flower: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  petalBox: { position: 'absolute', width: 36, height: 36, alignItems: 'center', justifyContent: 'space-between' },
  petal: { width: 7, height: 13, borderRadius: 4 },
  petalBottom: {},
  flowerCenter: { width: 9, height: 9, borderRadius: 5 },
  stars: { width: 360, height: 70 },
  rings: { width: 72, height: 46 },
  frameOuter: { position: 'absolute', left: 14, right: 14, top: 14, bottom: 14, borderWidth: 2, borderRadius: 2 },
  frameInner: { position: 'absolute', left: 22, right: 22, top: 22, bottom: 22, borderWidth: 1 },
  inset: { position: 'absolute', left: 16, right: 16, top: 16, bottom: 16, borderWidth: 1.5, borderRadius: 10 },
  arch: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 18,
    bottom: 18,
    borderWidth: 1.5,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  bracket: { position: 'absolute', width: 34, height: 34 },
  cornerTl: { left: 14, top: 14 },
  cornerTr: { right: 14, top: 14 },
  cornerBl: { left: 14, bottom: 14 },
  cornerBr: { right: 14, bottom: 14 },
  cornerDiamond: {
    position: 'absolute',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
    marginTop: -4,
  },
  band: { position: 'absolute', left: 0, right: 0, top: 0, height: 26 },
  bandBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 10 },
});
