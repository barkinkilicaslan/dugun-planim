import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { dashboardSummary, daysUntil, formatDate, formatMoney } from '@/domain/calculations';

export default function HomeScreen() {
  const { data, refresh, loading } = useApp();
  const theme = useAppTheme();
  const { t, intl } = useI18n();
  const summary = dashboardSummary(data);
  const dayLabel =
    summary.days > 0
      ? t('home.daysLeft', { days: summary.days })
      : summary.days === 0
        ? t('home.today')
        : t('home.daysAgo', { days: Math.abs(summary.days) });
  const money = (cents: number) => formatMoney(cents, data.profile.currency, intl);
  const upcoming = [
    ...data.tasks
      .filter((item) => !item.completed && item.dueDate)
      .map((item) => ({
        id: `t-${item.id}`,
        title: item.title,
        date: item.dueDate,
        type: t('home.typeTask'),
        href: `/edit/task?id=${item.id}` as const,
      })),
    ...data.budgetItems
      .filter((item) => item.dueDate && item.paidCents < item.actualCents)
      .map((item) => ({
        id: `b-${item.id}`,
        title: item.title,
        date: item.dueDate,
        type: t('home.typePayment'),
        href: `/edit/budget?id=${item.id}` as const,
      })),
  ]
    .filter((item) => daysUntil(item.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <Screen
      title={`${data.profile.couple1Name} & ${data.profile.couple2Name}`}
      subtitle={t('home.subtitle')}
      refreshing={loading}
      onRefresh={refresh}
    >
      <Card style={{ backgroundColor: theme.colors.primary }}>
        <AppText variant="caption" color={theme.colors.primaryText}>
          {t('home.countdownLabel')}
        </AppText>
        <AppText
          variant="display"
          color={theme.colors.primaryText}
          accessibilityLabel={summary.days > 0 ? t('home.daysLeftSentence', { days: summary.days }) : dayLabel}
        >
          {dayLabel}
        </AppText>
        <AppText color={theme.colors.primaryText}>
          {data.profile.weddingDate ? formatDate(data.profile.weddingDate, data.profile.dateFormat) : t('home.noDate')}
        </AppText>
      </Card>
      <Card>
        <View style={styles.progressHeader}>
          <AppText variant="subtitle">{t('home.progressTitle')}</AppText>
          <AppText variant="subtitle" color={theme.colors.primary}>
            %{summary.tasks.percentage}
          </AppText>
        </View>
        <ProgressBar value={summary.tasks.percentage} label={t('home.taskProgress')} />
        <AppText variant="caption" color={theme.colors.muted}>
          {t('home.progressCounts', { done: summary.tasks.completed, left: summary.tasks.remaining })}
        </AppText>
      </Card>
      <MetricGrid>
        <MetricCard label={t('home.totalBudget')} value={money(summary.budget.totalBudgetCents)} />
        <MetricCard
          label={t('home.spent')}
          value={money(summary.budget.actualCents)}
          tone={summary.budget.overBudgetCents > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label={t('home.remaining')}
          value={money(summary.budget.availableCents)}
          tone={summary.budget.availableCents < 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label={t('home.guestReplies')}
          value={t('home.attendingCount', { count: summary.guests.attending })}
          hint={t('home.waitingCount', { count: summary.guests.pending })}
        />
      </MetricGrid>
      <SectionHeader title={t('home.quickActions')} />
      <View style={styles.quick}>
        <Button label={t('home.addTask')} onPress={() => router.push('/edit/task')} style={styles.quickButton} />
        <Button
          label={t('home.addGuest')}
          onPress={() => router.push('/edit/guest')}
          variant="secondary"
          style={styles.quickButton}
        />
        <Button
          label={t('home.addExpense')}
          onPress={() => router.push('/edit/budget')}
          variant="secondary"
          style={styles.quickButton}
        />
      </View>
      <Card>
        <AppText variant="subtitle">{t('home.personal.title')}</AppText>
        <AppText color={theme.colors.muted}>{t('home.personal.body')}</AppText>
        <Button
          label={t('home.personal.upload')}
          accessibilityLabel={t('home.personal.uploadA11y')}
          onPress={() => router.push('/personal-invitation')}
        />
        {data.personalInvitations.length ? (
          <Button
            label={t('home.personal.view', { count: data.personalInvitations.length })}
            variant="secondary"
            onPress={() => router.push('/invitations')}
          />
        ) : null}
      </Card>
      <SectionHeader title={t('home.upcoming')} description={t('home.upcomingHint')} />
      {upcoming.length ? (
        <Card>
          {upcoming.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.type}
              meta={formatDate(item.date, data.profile.dateFormat)}
              onPress={() => router.push(item.href)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title={t('home.noUpcoming')}
          description={t('home.noUpcomingHint')}
          actionLabel={t('home.addTask')}
          onAction={() => router.push('/edit/task')}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickButton: { flexGrow: 1, minWidth: 125 },
});
