import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { shouldLoadThumbnail } from '@/components/theme/lazy-visibility';
import { StyleCard } from '@/components/theme/style-card';
import { AppText } from '@/components/ui/app-text';
import { getTheme, THEME_IDS, type ThemeId } from '@/constants/themes';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme, useThemeControls } from '@/context/theme-context';

const MAX_WIDTH = 720;
const GAP = spacing.md;

/**
 * İlk açılışta (kayıtlı tarz yokken) gösterilen "Tarzını seç" ekranı. Seçim yapılmadan devam edilemez;
 * seçimden sonra onboarding tamamlandıysa ana sayfaya, tamamlanmadıysa onboarding akışına gidilir.
 */
export default function StyleSelectScreen() {
  const { t } = useI18n();
  const base = useAppTheme();
  const { data } = useApp();
  const { setThemeId, hasChosen } = useThemeControls();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<ThemeId | null>(null);
  const [proceeding, setProceeding] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [gridTop, setGridTop] = useState(0);
  const [layouts, setLayouts] = useState<Partial<Record<ThemeId, { y: number; height: number }>>>({});

  const contentWidth = Math.min(width, MAX_WIDTH) - spacing.lg * 2;
  const cardWidth = Math.floor((contentWidth - GAP) / 2);
  const accent = selected ? getTheme(selected).colors : null;

  // Yönlendirme, tarz kaydı bağlama yansıdıktan sonra yapılır; böylece korumalı ekranlar seçimi görür.
  useEffect(() => {
    if (proceeding && hasChosen) router.replace(data.profile.onboardingCompleted ? '/(tabs)' : '/onboarding');
  }, [proceeding, hasChosen, data.profile.onboardingCompleted]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    // 120 pt kovalara yuvarlanır: aynı kovada state değişmez, kart ağacı yeniden çizilmez.
    setScrollY(Math.round(event.nativeEvent.contentOffset.y / 120) * 120);
  const onCardLayout = (id: ThemeId) => (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setLayouts((current) =>
      current[id]?.y === y && current[id]?.height === height ? current : { ...current, [id]: { y, height } },
    );
  };

  function proceed() {
    if (!selected || proceeding) return;
    setThemeId(selected);
    setProceeding(true);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: base.colors.background }]}>
      <ScrollView
        testID="style-scroll"
        onScroll={onScroll}
        scrollEventThrottle={64}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <AppText variant="display" accessibilityRole="header">
              {t('style.title')}
            </AppText>
            <AppText color={base.colors.muted}>{t('style.subtitle')}</AppText>
          </View>
          <View
            accessibilityRole="radiogroup"
            style={styles.grid}
            onLayout={(event) => setGridTop(event.nativeEvent.layout.y)}
          >
            {THEME_IDS.map((id, index) => (
              <StyleCard
                key={id}
                id={id}
                selected={selected === id}
                width={cardWidth}
                showImage={shouldLoadThumbnail({
                  index,
                  top: layouts[id] ? gridTop + layouts[id].y : undefined,
                  height: layouts[id]?.height,
                  scrollY,
                  viewportHeight,
                })}
                onLayout={onCardLayout(id)}
                onPress={setSelected}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: base.colors.surface,
            borderTopColor: base.colors.border,
            paddingBottom: Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <View style={styles.footerInner}>
          {selected ? null : (
            <AppText variant="caption" color={base.colors.muted} style={styles.hint}>
              {t('style.continuePick')}
            </AppText>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('style.continue')}
            accessibilityState={{ disabled: !selected }}
            disabled={!selected}
            onPress={proceed}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: accent ? accent.primary : base.colors.surfaceAlt,
                borderColor: accent ? accent.primary : base.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <AppText variant="label" color={accent ? accent.primaryText : base.colors.muted} style={styles.ctaLabel}>
              {t('style.continue')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  footerInner: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  hint: { textAlign: 'center' },
  cta: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  ctaLabel: { textAlign: 'center', fontSize: 16 },
});
