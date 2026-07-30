import { StyleSheet, View } from 'react-native';
import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.wrap}>
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText variant="caption" color={theme.colors.muted}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({ wrap: { gap: spacing.xs, marginTop: spacing.sm } });
