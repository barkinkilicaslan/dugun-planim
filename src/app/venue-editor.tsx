import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { VenueCanvas } from '@/components/venue/venue-canvas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import type { SeatingTable, VenueLayoutItem, VenueLayoutItemType } from '@/domain/models';
import {
  createVenueLayoutItem,
  moveVenueLayoutItem,
  resizeVenueLayoutItem,
  rotateVenueLayoutItem,
  VENUE_ITEM_LABELS,
  venueLayoutSummary,
} from '@/domain/venue-layout';

const AREA_TYPES: VenueLayoutItemType[] = ['stage', 'danceFloor', 'entrance', 'dj', 'service'];

export default function VenueEditorScreen() {
  const { data, createId, saveVenueLayoutItem, deleteVenueLayoutItem } = useApp();
  const theme = useAppTheme();
  const [draftItems, setDraftItems] = useState(data.venueLayoutItems);
  const [selectedId, setSelectedId] = useState<string>();
  const [busy, setBusy] = useState(false);

  const selected = draftItems.find((item) => item.id === selectedId);
  const unplacedTables = useMemo(
    () => data.tables.filter((table) => !draftItems.some((item) => item.tableId === table.id)),
    [data.tables, draftItems],
  );

  function updateDraft(item: VenueLayoutItem) {
    setDraftItems((current) => current.map((candidate) => (candidate.id === item.id ? item : candidate)));
  }

  async function persist(item: VenueLayoutItem) {
    const next = { ...item, updatedAt: new Date().toISOString() };
    updateDraft(next);
    try {
      await saveVenueLayoutItem(next);
    } catch (error) {
      Alert.alert('Salon planı kaydedilemedi', (error as Error).message);
      setDraftItems(data.venueLayoutItems);
    }
  }

  async function addItem(type: VenueLayoutItemType, table?: SeatingTable) {
    const now = new Date().toISOString();
    const item = createVenueLayoutItem({
      id: createId(),
      type,
      index: draftItems.length,
      now,
      label: table?.name,
      tableId: table?.id,
    });
    try {
      await saveVenueLayoutItem(item);
      setDraftItems((current) => [...current.filter((candidate) => candidate.id !== item.id), item]);
      setSelectedId(item.id);
    } catch (error) {
      Alert.alert('Öğe eklenemedi', (error as Error).message);
    }
  }

  async function createStarterLayout() {
    setBusy(true);
    const saved: VenueLayoutItem[] = [];
    const now = new Date().toISOString();
    const tablePositions = [
      { x: 0.05, y: 0.25 },
      { x: 0.77, y: 0.25 },
      { x: 0.05, y: 0.49 },
      { x: 0.77, y: 0.49 },
      { x: 0.05, y: 0.73 },
      { x: 0.77, y: 0.73 },
      { x: 0.28, y: 0.62 },
      { x: 0.54, y: 0.62 },
    ];
    const stage = { ...createVenueLayoutItem({ id: createId(), type: 'stage', index: 0, now }), x: 0.29, y: 0.04 };
    const danceFloor = {
      ...createVenueLayoutItem({ id: createId(), type: 'danceFloor', index: 1, now }),
      x: 0.33,
      y: 0.27,
    };
    const entrance = {
      ...createVenueLayoutItem({ id: createId(), type: 'entrance', index: 2, now }),
      x: 0.39,
      y: 0.86,
    };
    const starter: VenueLayoutItem[] = [
      stage,
      danceFloor,
      entrance,
      ...data.tables.map((table, index) => {
        const item = createVenueLayoutItem({
          id: createId(),
          type: 'table',
          index: index + 4,
          now,
          label: table.name,
          tableId: table.id,
        });
        const position = tablePositions[index];
        return position ? { ...item, ...position } : item;
      }),
    ];
    try {
      for (const item of starter) {
        await saveVenueLayoutItem(item);
        saved.push(item);
      }
      setDraftItems(starter);
      setSelectedId(starter[0]?.id);
    } catch (error) {
      setDraftItems(saved);
      setSelectedId(saved[0]?.id);
      Alert.alert('Başlangıç düzeni oluşturulamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function changeSelected(transform: (item: VenueLayoutItem) => VenueLayoutItem) {
    if (!selected || selected.locked) return;
    void persist(transform(selected));
  }

  function toggleLock() {
    if (!selected) return;
    void persist({ ...selected, locked: !selected.locked });
  }

  function confirmRemoveSelected() {
    if (!selected) return;
    const message =
      selected.type === 'table'
        ? 'Masa kaydı korunacak, yalnız salon çiziminden kaldırılacak.'
        : 'Bu alan salon çiziminden kaldırılacak.';
    Alert.alert(`${selected.label} kaldırılsın mı?`, message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteVenueLayoutItem(selected.id);
              setDraftItems((current) => current.filter((item) => item.id !== selected.id));
              setSelectedId(undefined);
            } catch (error) {
              Alert.alert('Öğe kaldırılamadı', (error as Error).message);
            }
          })();
        },
      },
    ]);
  }

  function confirmClear() {
    Alert.alert('Salon düzeni temizlensin mi?', 'Masalar ve davetliler korunur; yalnız çizimdeki konumlar silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Temizle',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              for (const item of draftItems) {
                await deleteVenueLayoutItem(item.id);
                setDraftItems((current) => current.filter((candidate) => candidate.id !== item.id));
              }
              setSelectedId(undefined);
            } catch (error) {
              Alert.alert('Salon düzeni tamamen temizlenemedi', (error as Error).message);
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <Screen title="Salon düzeni" subtitle={`${venueLayoutSummary(draftItems)} · Öğeleri sürükleyerek taşıyın`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
        accessibilityLabel="Salon planı araçları"
      >
        {!draftItems.length ? (
          <Button label="Hızlı başlangıç" onPress={() => void createStarterLayout()} loading={busy} />
        ) : null}
        {unplacedTables.map((table) => (
          <Button
            key={table.id}
            label={`+ ${table.name}`}
            variant="secondary"
            onPress={() => void addItem('table', table)}
          />
        ))}
        {AREA_TYPES.map((type) => (
          <Button
            key={type}
            label={`+ ${VENUE_ITEM_LABELS[type]}`}
            variant="secondary"
            onPress={() => void addItem(type)}
          />
        ))}
        {draftItems.length ? <Button label="Planı temizle" variant="ghost" onPress={confirmClear} /> : null}
      </ScrollView>

      <VenueCanvas
        items={draftItems}
        tables={data.tables}
        guests={data.guests}
        selectedId={selectedId}
        interactive
        onSelect={setSelectedId}
        onDraftChange={updateDraft}
        onMoveEnd={(item) => void persist(item)}
      />

      {selected ? (
        <Card style={styles.properties}>
          <View style={styles.propertyHeader}>
            <View style={styles.grow}>
              <AppText variant="subtitle">Seçili: {selected.label}</AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {VENUE_ITEM_LABELS[selected.type]} · {selected.rotation}°{selected.locked ? ' · kilitli' : ''}
              </AppText>
            </View>
            <Button label={selected.locked ? 'Kilidi aç' : 'Kilitle'} variant="ghost" onPress={toggleLock} />
          </View>

          <TextField
            label="Görünen ad"
            value={selected.label}
            editable={!selected.locked}
            onChangeText={(label) => updateDraft({ ...selected, label })}
            onBlur={() => void persist(selected)}
          />

          {selected.type === 'table' ? (
            <View style={styles.controlGroup}>
              <AppText variant="label">Masa şekli</AppText>
              <View style={styles.controls}>
                <Button
                  label="Yuvarlak"
                  variant={selected.shape === 'round' ? 'primary' : 'secondary'}
                  disabled={selected.locked}
                  onPress={() => changeSelected((item) => ({ ...item, shape: 'round' }))}
                />
                <Button
                  label="Dikdörtgen"
                  variant={selected.shape === 'rectangle' ? 'primary' : 'secondary'}
                  disabled={selected.locked}
                  onPress={() => changeSelected((item) => ({ ...item, shape: 'rectangle' }))}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.controlGroup}>
            <AppText variant="label">Konum</AppText>
            <View style={styles.controls}>
              <Button
                label="←"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, -0.025, 0))}
              />
              <Button
                label="↑"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0, -0.025))}
              />
              <Button
                label="↓"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0, 0.025))}
              />
              <Button
                label="→"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0.025, 0))}
              />
            </View>
          </View>

          <View style={styles.controlGroup}>
            <AppText variant="label">Boyut ve açı</AppText>
            <View style={styles.controls}>
              <Button
                label="Daralt"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, -0.025, 0))}
              />
              <Button
                label="Genişlet"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0.025, 0))}
              />
              <Button
                label="Kısalt"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0, -0.025))}
              />
              <Button
                label="Uzat"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0, 0.025))}
              />
              <Button
                label="−15°"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => rotateVenueLayoutItem(item, -15))}
              />
              <Button
                label="+15°"
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => rotateVenueLayoutItem(item, 15))}
              />
            </View>
          </View>

          <Button label="Çizimden kaldır" variant="danger" onPress={confirmRemoveSelected} />
        </Card>
      ) : (
        <Card>
          <AppText variant="subtitle">Bir öğe seçin</AppText>
          <AppText color={theme.colors.muted}>
            Taşımak veya özelliklerini değiştirmek için çizimde bir masa ya da alana dokunun.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { gap: spacing.sm, paddingBottom: spacing.xs },
  properties: { marginBottom: spacing.xl },
  propertyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1 },
  controlGroup: { gap: spacing.sm },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
