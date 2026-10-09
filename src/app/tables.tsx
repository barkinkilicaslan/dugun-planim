import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { VenueCanvas } from '@/components/venue/venue-canvas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { canAssignGuest, tableOccupancy } from '@/domain/calculations';
import type { SeatingTable } from '@/domain/models';
import { venueLayoutHtml, venueLayoutSummary } from '@/domain/venue-layout';
import { escapeHtml, pdfDocument, shareHtmlAsPdf } from '@/services/export';

export default function TablesScreen() {
  const { data, createId, saveTable, deleteTable, saveGuest } = useApp();
  const theme = useAppTheme();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('8');
  const unassigned = data.guests.filter((guest) => !guest.tableId && guest.rsvp !== 'declined');
  async function addTable() {
    const now = new Date().toISOString();
    const table: SeatingTable = {
      id: createId(),
      name,
      capacity: Number.parseInt(capacity, 10),
      createdAt: now,
      updatedAt: now,
    };
    try {
      await saveTable(table);
      setName('');
      setCapacity('8');
    } catch (error) {
      Alert.alert(t('tables.addFailed'), (error as Error).message);
    }
  }
  async function assign(guestId: string, tableId?: string) {
    const guest = data.guests.find((item) => item.id === guestId);
    if (!guest) return;
    const table = data.tables.find((item) => item.id === tableId);
    if (table && !canAssignGuest(table, guest, data.guests))
      return Alert.alert(t('tables.capacityExceeded'), t('tables.capacityExceededBody', { table: table.name }));
    try {
      await saveGuest({ ...guest, tableId, updatedAt: new Date().toISOString() });
    } catch (error) {
      Alert.alert(t('tables.assignFailed'), (error as Error).message);
    }
  }
  function confirmDelete(table: SeatingTable) {
    Alert.alert(t('tables.deleteTitle', { table: table.name }), t('tables.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteTable(table.id).catch((error) =>
            Alert.alert(t('common.deleteFailed'), error instanceof Error ? error.message : t('common.unknownError')),
          ),
      },
    ]);
  }
  async function exportPdf() {
    const body =
      venueLayoutHtml(data.venueLayoutItems, data.tables, data.guests, t) +
      data.tables
        .map(
          (table) =>
            `<h2>${escapeHtml(table.name)} (${tableOccupancy(table.id, data.guests)}/${table.capacity})</h2>${
              data.guests
                .filter((guest) => guest.tableId === table.id)
                .map(
                  (guest) =>
                    `<div class="row">${escapeHtml(guest.name)} · ${escapeHtml(t('common.person', { count: guest.partySize }))}</div>`,
                )
                .join('') || `<p>${escapeHtml(t('tables.pdfNoGuests'))}</p>`
            }`,
        )
        .join('') +
      `<h2>${escapeHtml(t('tables.pdfUnassigned'))}</h2>${unassigned.map((guest) => `<div class="row">${escapeHtml(guest.name)} · ${escapeHtml(t('common.person', { count: guest.partySize }))}</div>`).join('')}`;
    try {
      await shareHtmlAsPdf(t('tables.pdfFile'), pdfDocument(t('tables.pdfTitle'), body));
    } catch (error) {
      Alert.alert(t('common.pdfFailed'), (error as Error).message);
    }
  }
  return (
    <Screen
      title={t('nav.tables')}
      subtitle={t('tables.subtitle', { tables: data.tables.length, unassigned: unassigned.length })}
      action={
        <Button
          label={t('common.pdf')}
          variant="ghost"
          onPress={() => void exportPdf()}
          disabled={!data.tables.length}
        />
      }
    >
      <Card>
        <View style={styles.header}>
          <View style={styles.grow}>
            <AppText variant="subtitle">{t('tables.venueLayout')}</AppText>
            <AppText variant="caption" color={theme.colors.muted}>
              {venueLayoutSummary(data.venueLayoutItems, t)}
            </AppText>
          </View>
          <Button label={t('common.edit')} variant="secondary" onPress={() => router.push('/venue-editor')} />
        </View>
        <VenueCanvas compact items={data.venueLayoutItems} tables={data.tables} guests={data.guests} />
        <AppText variant="caption" color={theme.colors.muted}>
          {t('tables.venueHint')}
        </AppText>
      </Card>
      <Card>
        <AppText variant="subtitle">{t('tables.newTable')}</AppText>
        <View style={styles.form}>
          <View style={styles.grow}>
            <TextField
              label={t('tables.tableName')}
              value={name}
              onChangeText={setName}
              placeholder={t('tables.tableNamePlaceholder')}
            />
          </View>
          <View style={styles.capacity}>
            <TextField
              label={t('tables.capacity')}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Button label={t('tables.addTable')} onPress={() => void addTable()} />
      </Card>
      {data.tables.length ? (
        data.tables.map((table) => {
          const occupancy = tableOccupancy(table.id, data.guests);
          const assigned = data.guests.filter((guest) => guest.tableId === table.id);
          return (
            <Card key={table.id}>
              <View style={styles.header}>
                <View style={styles.grow}>
                  <AppText variant="subtitle">{table.name}</AppText>
                  <AppText
                    variant="caption"
                    color={occupancy > table.capacity ? theme.colors.danger : theme.colors.muted}
                  >
                    {t('tables.occupancy', { count: occupancy, capacity: table.capacity })}
                  </AppText>
                </View>
                <Button label={t('common.delete')} variant="ghost" onPress={() => confirmDelete(table)} />
              </View>
              <ProgressBar
                value={(occupancy / table.capacity) * 100}
                label={t('tables.occupancyLabel', { name: table.name })}
              />
              {assigned.map((guest) => (
                <View key={guest.id} style={styles.guest}>
                  <View style={styles.grow}>
                    <AppText variant="label">{guest.name}</AppText>
                    <AppText variant="caption" color={theme.colors.muted}>
                      {t('common.person', { count: guest.partySize })}
                    </AppText>
                  </View>
                  <Button label={t('tables.remove')} variant="ghost" onPress={() => void assign(guest.id, undefined)} />
                </View>
              ))}
            </Card>
          );
        })
      ) : (
        <EmptyState title={t('tables.noTablesTitle')} description={t('tables.noTablesHint')} />
      )}
      <SectionHeader title={t('tables.unassigned')} description={t('tables.unassignedHint')} />
      {unassigned.length ? (
        unassigned.map((guest) => (
          <Card key={guest.id}>
            <AppText variant="label">{t('tables.guestLine', { name: guest.name, count: guest.partySize })}</AppText>
            <View style={styles.assign}>
              {data.tables.map((table) => (
                <Button
                  key={table.id}
                  label={table.name}
                  variant={canAssignGuest(table, guest, data.guests) ? 'secondary' : 'ghost'}
                  disabled={!canAssignGuest(table, guest, data.guests)}
                  onPress={() => void assign(guest.id, table.id)}
                />
              ))}
            </View>
          </Card>
        ))
      ) : (
        <EmptyState title={t('tables.noUnassignedTitle')} description={t('tables.noUnassignedHint')} />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  form: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  grow: { flex: 1 },
  capacity: { width: 120 },
  header: { flexDirection: 'row', alignItems: 'center' },
  guest: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  assign: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
