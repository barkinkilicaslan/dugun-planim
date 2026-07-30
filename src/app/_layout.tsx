import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { AppProvider, useApp } from '@/context/app-context';
import { AppThemeProvider, useAppTheme } from '@/context/theme-context';
import { t } from '@/i18n';
import { configureNotifications } from '@/services/notifications';

void SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { loading, error, refresh } = useApp();
  const theme = useAppTheme();
  useEffect(() => {
    void configureNotifications();
  }, []);
  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);
  if (loading)
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <AppText>Planınız hazırlanıyor…</AppText>
      </View>
    );
  if (error)
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <AppText variant="title">Plan açılamadı</AppText>
        <AppText color={theme.colors.danger} style={styles.errorCopy}>
          {error}
        </AppText>
        <Button label="Tekrar dene" onPress={() => void refresh()} />
      </View>
    );
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
          headerBackTitle: t('nav.back'),
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="edit/task" options={{ title: t('nav.task') }} />
        <Stack.Screen name="edit/guest" options={{ title: t('nav.guest') }} />
        <Stack.Screen name="edit/budget" options={{ title: t('nav.budgetItem') }} />
        <Stack.Screen name="edit/vendor" options={{ title: t('nav.vendor') }} />
        <Stack.Screen name="edit/note" options={{ title: t('nav.note') }} />
        <Stack.Screen name="tables" options={{ title: t('nav.tables') }} />
        <Stack.Screen name="vendors" options={{ title: t('nav.vendors') }} />
        <Stack.Screen name="calendar" options={{ title: t('nav.calendar') }} />
        <Stack.Screen name="notes" options={{ title: t('nav.notes') }} />
        <Stack.Screen name="settings" options={{ title: t('nav.settings') }} />
        <Stack.Screen name="legal/[page]" options={{ title: t('nav.legal') }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>
    </AppProvider>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorCopy: { maxWidth: 520, textAlign: 'center' },
});
