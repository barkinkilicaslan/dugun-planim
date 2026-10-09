import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Eyebrow } from '@/components/home/home-hero';
import { IconBox, Motif } from '@/components/theme/decor';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { cardRadius, controlRadius } from '@/constants/themes';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { shouldCompactMetricValue } from '@/domain/metric-display';

export type Tone = 'default' | 'warning' | 'success';

export interface MetricItem {
  key: string;
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  glyph: string;
}

/**
 * "Temayı değiştir" eylemi: şu anki tarzı gösterir, dokununca altı temalı seçim ekranını açar. Tek bir düğme olarak
 * okunur; eylem metni yalnız renkle değil açık bir etiket ve ok işaretiyle de belirtilir. Dokunma alanı en az 56 pt.
 */
export function ThemeSwitchRow({
  currentName,
  label,
  actionLabel,
  accessibilityLabel,
  onPress,
}: {
  currentName: string;
  label: string;
  actionLabel: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <Pressable
      testID="home-theme-switch"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.themeRow,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: theme.shape.cardBorderWidth,
          borderRadius: cardRadius(theme),
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <IconBox glyph="◐" size={40} />
      <View style={styles.flex}>
        <Eyebrow color={c.muted}>{label}</Eyebrow>
        <AppText variant="label" numberOfLines={2}>
          {currentName}
        </AppText>
      </View>
      <View
        style={[
          styles.themeAction,
          { backgroundColor: c.primary, borderRadius: controlRadius(theme) > 40 ? 999 : controlRadius(theme) },
        ]}
      >
        <AppText variant="label" color={c.primaryText}>
          {actionLabel}
          {' ›'}
        </AppText>
      </View>
    </Pressable>
  );
}

export function HomeProgress({
  title,
  percentage,
  progressLabel,
  counts,
}: {
  title: string;
  percentage: number;
  progressLabel: string;
  counts: string;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <Card>
      <View style={styles.rowCenter}>
        <IconBox glyph="✓" size={40} />
        <View style={styles.flex}>
          <Eyebrow color={c.muted}>{title}</Eyebrow>
        </View>
        <AppText variant="title" color={c.primary} accessibilityLabel={`%${percentage}`}>
          %{percentage}
        </AppText>
      </View>
      <ProgressBar value={percentage} label={progressLabel} />
      <AppText variant="caption" color={c.muted}>
        {counts}
      </AppText>
    </Card>
  );
}

function toneColor(tone: Tone | undefined, theme: ReturnType<typeof useAppTheme>) {
  return tone === 'warning' ? theme.colors.warning : tone === 'success' ? theme.colors.success : theme.colors.primary;
}

/** Bütçe ve davetli özetleri; düzen (kart, karo, çizgili liste) temadan gelir. */
function MetricsBody({ items }: { items: MetricItem[] }) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const c = theme.colors;
  const variant = theme.layout.metrics;

  if (variant === 'rules')
    return (
      <Card style={styles.rulesCard}>
        {items.map((item, index) => (
          <View
            key={item.key}
            accessible
            accessibilityLabel={[item.label, item.value, item.hint].filter(Boolean).join(', ')}
            style={[
              styles.rule,
              index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : null,
            ]}
          >
            <View style={styles.flex}>
              <Eyebrow color={c.muted}>{item.label}</Eyebrow>
              {item.hint ? (
                <AppText variant="caption" color={c.muted}>
                  {item.hint}
                </AppText>
              ) : null}
            </View>
            <AppText
              variant="title"
              color={toneColor(item.tone, theme)}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.ruleValue, shouldCompactMetricValue(item.value, width) ? styles.compactValue : null]}
            >
              {item.value}
            </AppText>
          </View>
        ))}
      </Card>
    );

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const color = toneColor(item.tone, theme);
        const tiles = variant === 'tiles';
        return (
          <View
            key={item.key}
            accessible
            accessibilityLabel={[item.label, item.value, item.hint].filter(Boolean).join(', ')}
            style={[
              styles.metric,
              {
                borderRadius: cardRadius(theme),
                backgroundColor: tiles ? c.surfaceAlt : c.surface,
                borderColor: c.border,
                borderWidth: tiles ? 0 : theme.shape.cardBorderWidth,
                borderLeftWidth: tiles ? 5 : theme.shape.cardBorderWidth,
                borderLeftColor: tiles ? color : c.border,
              },
            ]}
          >
            {!tiles ? <IconBox glyph={item.glyph} size={34} /> : null}
            <Eyebrow color={c.muted}>{item.label}</Eyebrow>
            <AppText
              variant="title"
              color={color}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={[styles.metricValue, shouldCompactMetricValue(item.value, width) ? styles.compactValue : null]}
            >
              {item.value}
            </AppText>
            {item.hint ? (
              <AppText variant="caption" color={c.muted}>
                {item.hint}
              </AppText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export interface QuickAction {
  key: string;
  label: string;
  glyph: string;
  onPress: () => void;
}

/** Hızlı işlemler; simge karoları, hap düğmeler veya satırlar olarak çizilir. */
function QuickBody({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  const c = theme.colors;
  const variant = theme.layout.quick;

  if (variant === 'rows')
    return (
      <Card style={styles.rulesCard}>
        {actions.map((action, index) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionRow,
              index < actions.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : null,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <IconBox glyph={action.glyph} size={36} />
            <AppText variant="label" style={styles.flex}>
              {action.label}
            </AppText>
            <AppText color={c.muted}>›</AppText>
          </Pressable>
        ))}
      </Card>
    );

  if (variant === 'pills')
    return (
      <View style={styles.pills}>
        {actions.map((action, index) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.pill,
              {
                borderRadius: controlRadius(theme) > 40 ? 999 : cardRadius(theme),
                backgroundColor: index === 0 ? c.primary : c.surface,
                borderColor: index === 0 ? c.primary : c.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText
              color={index === 0 ? c.primaryText : c.iconBoxText}
              style={styles.pillGlyph}
              allowFontScaling={false}
            >
              {action.glyph}
            </AppText>
            <AppText variant="label" color={index === 0 ? c.primaryText : c.text} style={styles.flexShrink}>
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    );

  return (
    <View style={styles.tileRow}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.tile,
            {
              borderRadius: cardRadius(theme),
              backgroundColor: c.surface,
              borderColor: c.border,
              borderWidth: theme.shape.cardBorderWidth,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <IconBox glyph={action.glyph} size={44} />
          <AppText variant="label" style={styles.tileLabel}>
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

export function HomeMetrics({ items }: { items: MetricItem[] }) {
  const theme = useAppTheme();
  return (
    <View testID={`home-metrics-${theme.layout.metrics}`}>
      <MetricsBody items={items} />
    </View>
  );
}

export function HomeQuickActions({ actions }: { actions: QuickAction[] }) {
  const theme = useAppTheme();
  return (
    <View testID={`home-quick-${theme.layout.quick}`}>
      <QuickBody actions={actions} />
    </View>
  );
}

/** Kişisel davetiye yükleme kartı: içerik ve işlev aynı, görünüm tema motifiyle zenginleşir. */
export function PersonalInvitationCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const c = theme.colors;
  return (
    <Card style={{ overflow: 'hidden' }}>
      <View style={styles.decor}>
        <Motif kind={theme.motif} size={70} color={c.accent} altColor={c.secondary} />
      </View>
      <View style={styles.rowCenter}>
        <IconBox glyph="✉" size={44} />
        <AppText variant="subtitle" style={styles.flex} accessibilityRole="header">
          {title}
        </AppText>
      </View>
      <AppText color={c.muted}>{body}</AppText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { flexGrow: 1, flexBasis: 150, minWidth: 140, padding: spacing.lg, gap: spacing.xs },
  metricValue: { fontSize: 21, lineHeight: 27 },
  compactValue: { fontSize: 15, lineHeight: 22 },
  rulesCard: { paddingVertical: spacing.xs, gap: 0 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  ruleValue: { maxWidth: '55%', fontSize: 20, lineHeight: 26 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexGrow: 1,
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pillGlyph: { fontSize: 18, fontWeight: '700' },
  tileRow: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    minHeight: 104,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tileLabel: { textAlign: 'center' },
  decor: { position: 'absolute', top: -8, right: -8, opacity: 0.35 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, padding: spacing.md },
  themeAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
});
