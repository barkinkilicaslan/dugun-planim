import { router } from 'expo-router';

import { HomeHero } from '@/components/home/home-hero';
import {
  HomeMetrics,
  HomeProgress,
  HomeQuickActions,
  PersonalInvitationCard,
  type MetricItem,
} from '@/components/home/home-sections';
import { IconBox } from '@/components/theme/decor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { dashboardSummary, daysUntil, formatDate, formatMoney } from '@/domain/calculations';

export default function HomeScreen() {
  const { data, refresh, loading } = useApp();
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
        glyph: '✓',
        href: `/edit/task?id=${item.id}` as const,
      })),
    ...data.budgetItems
      .filter((item) => item.dueDate && item.paidCents < item.actualCents)
      .map((item) => ({
        id: `b-${item.id}`,
        title: item.title,
        date: item.dueDate,
        type: t('home.typePayment'),
        glyph: '¤',
        href: `/edit/budget?id=${item.id}` as const,
      })),
  ]
    .filter((item) => daysUntil(item.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Uyarı yalnız renkle değil "Bütçenin üzerinde" metniyle de aktarılır.
  const overBudget = t('home.overBudget');
  const metrics: MetricItem[] = [
    { key: 'total', label: t('home.totalBudget'), value: money(summary.budget.totalBudgetCents), glyph: '¤' },
    {
      key: 'spent',
      label: t('home.spent'),
      value: money(summary.budget.actualCents),
      tone: summary.budget.overBudgetCents > 0 ? 'warning' : 'default',
      hint: summary.budget.overBudgetCents > 0 ? overBudget : undefined,
      glyph: '↓',
    },
    {
      key: 'remaining',
      label: t('home.remaining'),
      value: money(summary.budget.availableCents),
      tone: summary.budget.availableCents < 0 ? 'warning' : 'success',
      hint: summary.budget.availableCents < 0 ? overBudget : undefined,
      glyph: '↑',
    },
    {
      key: 'guests',
      label: t('home.guestReplies'),
      value: t('home.attendingCount', { count: summary.guests.attending }),
      hint: t('home.waitingCount', { count: summary.guests.pending }),
      glyph: '☷',
    },
  ];

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <HomeHero
        eyebrow={t('home.countdownLabel')}
        countdown={dayLabel}
        countdownA11y={summary.days > 0 ? t('home.daysLeftSentence', { days: summary.days }) : dayLabel}
        dateText={
          data.profile.weddingDate ? formatDate(data.profile.weddingDate, data.profile.dateFormat) : t('home.noDate')
        }
        names={`${data.profile.couple1Name} & ${data.profile.couple2Name}`}
      />
      <HomeProgress
        title={t('home.progressTitle')}
        percentage={summary.tasks.percentage}
        progressLabel={t('home.taskProgress')}
        counts={t('home.progressCounts', { done: summary.tasks.completed, left: summary.tasks.remaining })}
      />
      <HomeMetrics items={metrics} />
      <SectionHeader title={t('home.quickActions')} />
      <HomeQuickActions
        actions={[
          { key: 'task', label: t('home.addTask'), glyph: '✓', onPress: () => router.push('/edit/task') },
          { key: 'guest', label: t('home.addGuest'), glyph: '☷', onPress: () => router.push('/edit/guest') },
          { key: 'expense', label: t('home.addExpense'), glyph: '¤', onPress: () => router.push('/edit/budget') },
        ]}
      />
      <PersonalInvitationCard title={t('home.personal.title')} body={t('home.personal.body')}>
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
      </PersonalInvitationCard>
      <SectionHeader title={t('home.upcoming')} description={t('home.upcomingHint')} />
      {upcoming.length ? (
        <Card>
          {upcoming.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.type}
              meta={formatDate(item.date, data.profile.dateFormat)}
              leading={<IconBox glyph={item.glyph} size={36} />}
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
