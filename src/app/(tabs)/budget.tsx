import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { budgetSummary, categoryDistribution, formatDate, formatMoney } from '@/domain/calculations';
import { escapeHtml, pdfDocument, shareHtmlAsPdf, shareTextFile } from '@/services/export';

export default function BudgetScreen() {
  const { data } = useApp();
  const theme = useAppTheme();
  const { t, intl } = useI18n();
  const money = (cents: number) => formatMoney(cents, data.profile.currency, intl);
  const summary = budgetSummary(data.budgetItems, data.profile.estimatedBudgetCents);
  const distribution = categoryDistribution(data.budgetItems);
  async function exportCsv() {
    const header = `${t('budget.csvHeader')}\r\n`;
    const rows = data.budgetItems
      .map((item) =>
        [
          item.category,
          item.title,
          item.plannedCents / 100,
          item.actualCents / 100,
          item.paidCents / 100,
          (item.actualCents - item.paidCents) / 100,
          item.dueDate,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\r\n');
    try {
      await shareTextFile(t('budget.csvFile'), `\uFEFF${header}${rows}`, 'text/csv');
    } catch (error) {
      Alert.alert(t('common.exportFailed'), (error as Error).message);
    }
  }
  async function exportPdf() {
    const body = `<h2>${escapeHtml(t('budget.pdfSummary'))}</h2><p>${escapeHtml(t('budget.pdfTotal'))}: ${escapeHtml(money(summary.totalBudgetCents))}<br>${escapeHtml(t('budget.pdfActual'))}: ${escapeHtml(money(summary.actualCents))}<br>${escapeHtml(t('budget.pdfPaid'))}: ${escapeHtml(money(summary.paidCents))}</p><h2>${escapeHtml(t('budget.pdfItems'))}</h2><table><tr><th>${escapeHtml(t('budget.pdfItem'))}</th><th>${escapeHtml(t('budget.pdfActual'))}</th><th>${escapeHtml(t('budget.pdfPaid'))}</th></tr>${data.budgetItems.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(money(item.actualCents))}</td><td>${escapeHtml(money(item.paidCents))}</td></tr>`).join('')}</table>`;
    try {
      await shareHtmlAsPdf(t('budget.pdfFile'), pdfDocument(t('budget.pdfTitle'), body));
    } catch (error) {
      Alert.alert(t('common.pdfFailed'), (error as Error).message);
    }
  }
  return (
    <Screen
      title={t('tabs.budget')}
      subtitle={t('budget.subtitle')}
      action={<Button label={t('common.add')} onPress={() => router.push('/edit/budget')} />}
    >
      {summary.overBudgetCents > 0 ? (
        <Card style={{ borderColor: theme.colors.warning }}>
          <AppText variant="label" color={theme.colors.warning}>
            {t('budget.overTitle')}
          </AppText>
          <AppText>{t('budget.overBody', { amount: money(summary.overBudgetCents) })}</AppText>
        </Card>
      ) : null}
      <MetricGrid>
        <MetricCard label={t('budget.total')} value={money(summary.totalBudgetCents)} />
        <MetricCard label={t('budget.actual')} value={money(summary.actualCents)} />
        <MetricCard label={t('budget.paid')} value={money(summary.paidCents)} tone="success" />
        <MetricCard
          label={t('budget.paymentsLeft')}
          value={money(summary.remainingPaymentsCents)}
          tone={summary.remainingPaymentsCents > 0 ? 'warning' : 'success'}
        />
      </MetricGrid>
      <View style={styles.actions}>
        <Button
          label={t('common.csv')}
          variant="secondary"
          onPress={() => void exportCsv()}
          disabled={!data.budgetItems.length}
        />
        <Button
          label={t('common.pdf')}
          variant="ghost"
          onPress={() => void exportPdf()}
          disabled={!data.budgetItems.length}
        />
      </View>
      <SectionHeader title={t('budget.distribution')} />
      {distribution.length ? (
        <Card>
          {distribution.map((entry) => (
            <View key={entry.category} style={styles.distribution}>
              <AppText variant="label">{entry.category}</AppText>
              <AppText color={theme.colors.primary}>{money(entry.cents)}</AppText>
            </View>
          ))}
        </Card>
      ) : (
        <AppText color={theme.colors.muted}>{t('budget.distributionEmpty')}</AppText>
      )}
      <SectionHeader title={t('budget.items')} />
      {data.budgetItems.length ? (
        <Card>
          {data.budgetItems.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={`${item.category}${
                item.dueDate ? ` · ${t('budget.due', { date: formatDate(item.dueDate, data.profile.dateFormat) })}` : ''
              }`}
              meta={money(item.actualCents)}
              onPress={() => router.push(`/edit/budget?id=${item.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title={t('budget.emptyTitle')}
          description={t('budget.emptyHint')}
          actionLabel={t('budget.addFirst')}
          onAction={() => router.push('/edit/budget')}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm },
  distribution: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
});
