import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

export function ListRow({
  title,
  subtitle,
  meta,
  onPress,
  leading,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  leading?: ReactNode;
  accessibilityLabel?: string;
}) {
  const theme = useAppTheme();
  // Satır tek bir erişilebilir öğedir ve etiketi çocuk metinlerin yerine geçer; bu yüzden alt metin ve sağdaki değer
  // (durum, tutar, tarih) etikete katılmazsa ekran okuyucu yalnız başlığı okur.
  const spokenLabel = accessibilityLabel ?? [title, subtitle, meta].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={spokenLabel}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.border, opacity: pressed ? 0.72 : 1 }]}
    >
      {typeof leading === 'string' || typeof leading === 'number' ? (
        <AppText color={theme.colors.primary} style={styles.leading}>
          {leading}
        </AppText>
      ) : (
        leading
      )}
      <View style={styles.copy}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {meta ? (
        <AppText variant="caption" color={theme.colors.primary} style={styles.meta}>
          {meta}
        </AppText>
      ) : null}
      {onPress ? <AppText color={theme.colors.muted}>›</AppText> : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  copy: { flex: 1, gap: 2 },
  meta: { maxWidth: 108, textAlign: 'right' },
  leading: { width: 28, textAlign: 'center', fontSize: 22, fontWeight: '700' },
});
