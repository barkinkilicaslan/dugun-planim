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
import { useAppTheme } from '@/context/theme-context';
import { canAssignGuest, tableOccupancy } from '@/domain/calculations';
import type { SeatingTable } from '@/domain/models';
import { venueLayoutHtml, venueLayoutSummary } from '@/domain/venue-layout';
import { escapeHtml, pdfDocument, shareHtmlAsPdf } from '@/services/export';

export default function TablesScreen() {
  const { data, createId, saveTable, deleteTable, saveGuest } = useApp();
  const theme = useAppTheme();
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
      Alert.alert('Masa eklenemedi', (error as Error).message);
    }
  }
  async function assign(guestId: string, tableId?: string) {
    const guest = data.guests.find((item) => item.id === guestId);
    if (!guest) return;
    const table = data.tables.find((item) => item.id === tableId);
    if (table && !canAssignGuest(table, guest, data.guests))
      return Alert.alert('Kapasite aşılıyor', `${table.name} bu davetli grubu için yeterli boşluğa sahip değil.`);
    try {
      await saveGuest({ ...guest, tableId, updatedAt: new Date().toISOString() });
    } catch (error) {
      Alert.alert('Atama yapılamadı', (error as Error).message);
    }
  }
  function confirmDelete(table: SeatingTable) {
    Alert.alert(`${table.name} silinsin mi?`, 'Bu masadaki davetliler atanmamış listeye döner.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteTable(table.id) },
    ]);
  }
  async function exportPdf() {
    const body =
      venueLayoutHtml(data.venueLayoutItems, data.tables, data.guests) +
      data.tables
        .map(
          (table) =>
            `<h2>${escapeHtml(table.name)} (${tableOccupancy(table.id, data.guests)}/${table.capacity})</h2>${
              data.guests
                .filter((guest) => guest.tableId === table.id)
                .map((guest) => `<div class="row">${escapeHtml(guest.name)} · ${guest.partySize} kişi</div>`)
                .join('') || '<p>Atanmış davetli yok.</p>'
            }`,
        )
        .join('') +
      `<h2>Atanmamış</h2>${unassigned.map((guest) => `<div class="row">${escapeHtml(guest.name)} · ${guest.partySize} kişi</div>`).join('')}`;
    try {
      await shareHtmlAsPdf('dugun-planim-masa-plani.pdf', pdfDocument('Masa Planı', body));
    } catch (error) {
      Alert.alert('PDF oluşturulamadı', (error as Error).message);
    }
  }
  return (
    <Screen
      title="Masa planı"
      subtitle={`${data.tables.length} masa · ${unassigned.length} atanmamış`}
      action={<Button label="PDF" variant="ghost" onPress={() => void exportPdf()} disabled={!data.tables.length} />}
    >
      <Card>
        <View style={styles.header}>
          <View style={styles.grow}>
            <AppText variant="subtitle">Salon düzeni</AppText>
            <AppText variant="caption" color={theme.colors.muted}>
              {venueLayoutSummary(data.venueLayoutItems)}
            </AppText>
          </View>
          <Button label="Düzenle" variant="secondary" onPress={() => router.push('/venue-editor')} />
        </View>
        <VenueCanvas compact items={data.venueLayoutItems} tables={data.tables} guests={data.guests} />
        <AppText variant="caption" color={theme.colors.muted}>
          Masa, sahne, dans pisti ve diğer alanları düğün mekânınıza göre yerleştirin.
        </AppText>
      </Card>
      <Card>
        <AppText variant="subtitle">Yeni masa</AppText>
        <View style={styles.form}>
          <View style={styles.grow}>
            <TextField label="Masa adı" value={name} onChangeText={setName} placeholder="Örn. Masa 1" />
          </View>
          <View style={styles.capacity}>
            <TextField label="Kapasite" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
          </View>
        </View>
        <Button label="Masa ekle" onPress={() => void addTable()} />
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
                    {occupancy}/{table.capacity} kişi
                  </AppText>
                </View>
                <Button label="Sil" variant="ghost" onPress={() => confirmDelete(table)} />
              </View>
              <ProgressBar value={(occupancy / table.capacity) * 100} label={`${table.name} doluluk oranı`} />
              {assigned.map((guest) => (
                <View key={guest.id} style={styles.guest}>
                  <View style={styles.grow}>
                    <AppText variant="label">{guest.name}</AppText>
                    <AppText variant="caption" color={theme.colors.muted}>
                      {guest.partySize} kişi
                    </AppText>
                  </View>
                  <Button label="Çıkar" variant="ghost" onPress={() => void assign(guest.id, undefined)} />
                </View>
              ))}
            </Card>
          );
        })
      ) : (
        <EmptyState
          title="Henüz masa yok"
          description="Önce masa ve kapasite ekleyin; ardından davetlileri kapasiteyi aşmadan yerleştirin."
        />
      )}
      <SectionHeader
        title="Atanmamış davetliler"
        description="Katılmıyor olarak işaretlenenler masa planına dahil edilmez."
      />
      {unassigned.length ? (
        unassigned.map((guest) => (
          <Card key={guest.id}>
            <AppText variant="label">
              {guest.name} · {guest.partySize} kişi
            </AppText>
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
        <EmptyState title="Atanmamış davetli yok" description="Katılacak tüm davetliler bir masaya yerleştirildi." />
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
