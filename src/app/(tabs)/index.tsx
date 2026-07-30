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
import { useAppTheme } from '@/context/theme-context';
import { dashboardSummary, daysUntil, formatDate, formatMoney } from '@/domain/calculations';

export default function HomeScreen() {
  const { data, refresh, loading } = useApp();
  const theme = useAppTheme();
  const summary = dashboardSummary(data);
  const dayLabel =
    summary.days > 0 ? `${summary.days} gün` : summary.days === 0 ? 'Bugün' : `${Math.abs(summary.days)} gün geçti`;
  const upcoming = [
    ...data.tasks
      .filter((item) => !item.completed && item.dueDate)
      .map((item) => ({
        id: `t-${item.id}`,
        title: item.title,
        date: item.dueDate,
        type: 'Görev',
        href: `/edit/task?id=${item.id}` as const,
      })),
    ...data.budgetItems
      .filter((item) => item.dueDate && item.paidCents < item.actualCents)
      .map((item) => ({
        id: `b-${item.id}`,
        title: item.title,
        date: item.dueDate,
        type: 'Ödeme',
        href: `/edit/budget?id=${item.id}` as const,
      })),
  ]
    .filter((item) => daysUntil(item.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <Screen
      title={`${data.profile.couple1Name} & ${data.profile.couple2Name}`}
      subtitle="Planınızın bugünkü görünümü"
      refreshing={loading}
      onRefresh={refresh}
    >
      <Card style={{ backgroundColor: theme.colors.primary }}>
        <AppText variant="caption" color={theme.colors.primaryText}>
          Düğüne kalan
        </AppText>
        <AppText variant="display" color={theme.colors.primaryText}>
          {dayLabel}
        </AppText>
        <AppText color={theme.colors.primaryText}>
          {data.profile.weddingDate
            ? formatDate(data.profile.weddingDate, data.profile.dateFormat)
            : 'Tarih belirlenmedi'}
        </AppText>
      </Card>
      <Card>
        <View style={styles.progressHeader}>
          <AppText variant="subtitle">Hazırlık ilerlemesi</AppText>
          <AppText variant="subtitle" color={theme.colors.primary}>
            %{summary.tasks.percentage}
          </AppText>
        </View>
        <ProgressBar value={summary.tasks.percentage} label="Görev ilerlemesi" />
        <AppText variant="caption" color={theme.colors.muted}>
          {summary.tasks.completed} tamamlandı · {summary.tasks.remaining} kaldı
        </AppText>
      </Card>
      <MetricGrid>
        <MetricCard label="Toplam bütçe" value={formatMoney(summary.budget.totalBudgetCents, data.profile.currency)} />
        <MetricCard
          label="Harcanan"
          value={formatMoney(summary.budget.actualCents, data.profile.currency)}
          tone={summary.budget.overBudgetCents > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Kalan"
          value={formatMoney(summary.budget.availableCents, data.profile.currency)}
          tone={summary.budget.availableCents < 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Davetli yanıtları"
          value={`${summary.guests.attending} katılıyor`}
          hint={`${summary.guests.pending} kişi bekliyor`}
        />
      </MetricGrid>
      <SectionHeader title="Hızlı işlemler" />
      <View style={styles.quick}>
        <Button label="Görev ekle" onPress={() => router.push('/edit/task')} style={styles.quickButton} />
        <Button
          label="Davetli ekle"
          onPress={() => router.push('/edit/guest')}
          variant="secondary"
          style={styles.quickButton}
        />
        <Button
          label="Harcama ekle"
          onPress={() => router.push('/edit/budget')}
          variant="secondary"
          style={styles.quickButton}
        />
      </View>
      <SectionHeader title="Yaklaşanlar" description="En yakın üç görev ve ödeme" />
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
          title="Yaklaşan iş yok"
          description="Tarihli bir görev veya vadesi olan ödeme eklediğinizde burada görünür."
          actionLabel="Görev ekle"
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
