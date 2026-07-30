import { Tabs } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { useAppTheme } from '@/context/theme-context';
import { t } from '@/i18n';

const icons: Record<string, string> = { index: '⌂', tasks: '✓', guests: '☷', budget: '₺', more: '•••' };

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          minHeight: 64,
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <AppText color={String(color)} style={{ fontSize: 21, fontWeight: '700' }}>
            {icons[route.name] ?? '•'}
          </AppText>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="tasks" options={{ title: t('tabs.tasks') }} />
      <Tabs.Screen name="guests" options={{ title: t('tabs.guests') }} />
      <Tabs.Screen name="budget" options={{ title: t('tabs.budget') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.more') }} />
    </Tabs>
  );
}
