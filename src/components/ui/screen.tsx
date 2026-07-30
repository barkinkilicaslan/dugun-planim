import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { AppText } from './app-text';

export function Screen({
  children,
  title,
  subtitle,
  action,
  refreshing,
  onRefresh,
  scroll = true,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}>) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xxl) }]}>
      {(title || subtitle || action) && (
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {title ? <AppText variant="display">{title}</AppText> : null}
            {subtitle ? <AppText color={theme.colors.muted}>{subtitle}</AppText> : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                />
              ) : undefined
            }
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1, gap: spacing.xs },
});
