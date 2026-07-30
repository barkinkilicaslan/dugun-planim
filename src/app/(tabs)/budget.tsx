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
import { useAppTheme } from '@/context/theme-context';
import { budgetSummary, categoryDistribution, formatDate, formatMoney } from '@/domain/calculations';
import { escapeHtml, pdfDocument, shareHtmlAsPdf, shareTextFile } from '@/services/export';

export default function BudgetScreen() {
  const { data } = useApp();
  const theme = useAppTheme();
  const summary = budgetSummary(data.budgetItems, data.profile.estimatedBudgetCents);
  const distribution = categoryDistribution(data.budgetItems);
  async function exportCsv() {
    const header = 'kategori,ad,planlanan,gerceklesen,odenen,kalan,vade\r\n';
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
      await shareTextFile('dugun-planim-butce.csv', `\uFEFF${header}${rows}`, 'text/csv');
    } catch (error) {
      Alert.alert('Dışa aktarılamadı', (error as Error).message);
    }
  }
  async function exportPdf() {
    const body = `<h2>Özet</h2><p>Toplam: ${escapeHtml(formatMoney(summary.totalBudgetCents, data.profile.currency))}<br>Gerçekleşen: ${escapeHtml(formatMoney(summary.actualCents, data.profile.currency))}<br>Ödenen: ${escapeHtml(formatMoney(summary.paidCents, data.profile.currency))}</p><h2>Kalemler</h2><table><tr><th>Kalem</th><th>Gerçekleşen</th><th>Ödenen</th></tr>${data.budgetItems.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(formatMoney(item.actualCents, data.profile.currency))}</td><td>${escapeHtml(formatMoney(item.paidCents, data.profile.currency))}</td></tr>`).join('')}</table>`;
    try {
      await shareHtmlAsPdf('dugun-planim-butce.pdf', pdfDocument('Bütçe Özeti', body));
    } catch (error) {
      Alert.alert('PDF oluşturulamadı', (error as Error).message);
    }
  }
  return (
    <Screen
      title="Bütçe"
      subtitle="Planlanan, gerçekleşen ve ödenen"
      action={<Button label="+ Ekle" onPress={() => router.push('/edit/budget')} />}
    >
      {summary.overBudgetCents > 0 ? (
        <Card style={{ borderColor: theme.colors.warning }}>
          <AppText variant="label" color={theme.colors.warning}>
            Bütçe aşımı
          </AppText>
          <AppText>
            {formatMoney(summary.overBudgetCents, data.profile.currency)} bütçe sınırının üzerindesiniz.
          </AppText>
        </Card>
      ) : null}
      <MetricGrid>
        <MetricCard label="Toplam" value={formatMoney(summary.totalBudgetCents, data.profile.currency)} />
        <MetricCard label="Gerçekleşen" value={formatMoney(summary.actualCents, data.profile.currency)} />
        <MetricCard label="Ödenen" value={formatMoney(summary.paidCents, data.profile.currency)} tone="success" />
        <MetricCard
          label="Ödeme kalan"
          value={formatMoney(summary.remainingPaymentsCents, data.profile.currency)}
          tone={summary.remainingPaymentsCents > 0 ? 'warning' : 'success'}
        />
      </MetricGrid>
      <View style={styles.actions}>
        <Button label="CSV" variant="secondary" onPress={() => void exportCsv()} disabled={!data.budgetItems.length} />
        <Button label="PDF" variant="ghost" onPress={() => void exportPdf()} disabled={!data.budgetItems.length} />
      </View>
      <SectionHeader title="Kategori dağılımı" />
      {distribution.length ? (
        <Card>
          {distribution.map((entry) => (
            <View key={entry.category} style={styles.distribution}>
              <AppText variant="label">{entry.category}</AppText>
              <AppText color={theme.colors.primary}>{formatMoney(entry.cents, data.profile.currency)}</AppText>
            </View>
          ))}
        </Card>
      ) : (
        <AppText color={theme.colors.muted}>Harcama eklendiğinde kategori dağılımı burada görünür.</AppText>
      )}
      <SectionHeader title="Bütçe kalemleri" />
      {data.budgetItems.length ? (
        <Card>
          {data.budgetItems.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={`${item.category}${
                item.dueDate ? ` · Vade ${formatDate(item.dueDate, data.profile.dateFormat)}` : ''
              }`}
              meta={formatMoney(item.actualCents, data.profile.currency)}
              onPress={() => router.push(`/edit/budget?id=${item.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Henüz bütçe kalemi yok"
          description="Mekân, fotoğraf, kıyafet veya başka bir kategori için planlanan ve gerçekleşen tutarı ekleyin."
          actionLabel="İlk kalemi ekle"
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
