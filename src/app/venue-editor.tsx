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
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import type { SeatingTable, VenueLayoutItem, VenueLayoutItemType } from '@/domain/models';
import {
  createVenueLayoutItem,
  moveVenueLayoutItem,
  resizeVenueLayoutItem,
  rotateVenueLayoutItem,
  venueDisplayLabel,
  venueItemLabel,
  venueLayoutSummary,
} from '@/domain/venue-layout';

const AREA_TYPES: VenueLayoutItemType[] = ['stage', 'danceFloor', 'entrance', 'dj', 'service'];

export default function VenueEditorScreen() {
  const { data, createId, saveVenueLayoutItem, deleteVenueLayoutItem } = useApp();
  const theme = useAppTheme();
  const { t } = useI18n();
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
      Alert.alert(t('venueEditor.saveFailed'), (error as Error).message);
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
      Alert.alert(t('venueEditor.addFailed'), (error as Error).message);
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
      Alert.alert(t('venueEditor.starterFailed'), (error as Error).message);
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
    const message = selected.type === 'table' ? t('venueEditor.removeTableBody') : t('venueEditor.removeAreaBody');
    Alert.alert(t('venueEditor.removeTitle', { label: venueDisplayLabel(t, selected) }), message, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteVenueLayoutItem(selected.id);
              setDraftItems((current) => current.filter((item) => item.id !== selected.id));
              setSelectedId(undefined);
            } catch (error) {
              Alert.alert(t('venueEditor.removeFailed'), (error as Error).message);
            }
          })();
        },
      },
    ]);
  }

  function confirmClear() {
    Alert.alert(t('venueEditor.clearTitle'), t('venueEditor.clearBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
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
              Alert.alert(t('venueEditor.clearFailed'), (error as Error).message);
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <Screen
      title={t('nav.venueEditor')}
      subtitle={t('venueEditor.subtitle', { summary: venueLayoutSummary(draftItems, t) })}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
        accessibilityLabel={t('venueEditor.toolbar')}
      >
        {!draftItems.length ? (
          <Button label={t('venueEditor.quickStart')} onPress={() => void createStarterLayout()} loading={busy} />
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
            label={`+ ${venueItemLabel(t, type)}`}
            variant="secondary"
            onPress={() => void addItem(type)}
          />
        ))}
        {draftItems.length ? (
          <Button label={t('venueEditor.clearPlan')} variant="ghost" onPress={confirmClear} />
        ) : null}
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
              <AppText variant="subtitle">
                {t('venueEditor.selected', { label: venueDisplayLabel(t, selected) })}
              </AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {selected.locked
                  ? t('venueEditor.selectedMetaLocked', {
                      type: venueItemLabel(t, selected.type),
                      rotation: selected.rotation,
                    })
                  : t('venueEditor.selectedMeta', {
                      type: venueItemLabel(t, selected.type),
                      rotation: selected.rotation,
                    })}
              </AppText>
            </View>
            <Button
              label={selected.locked ? t('venueEditor.unlock') : t('venueEditor.lock')}
              variant="ghost"
              onPress={toggleLock}
            />
          </View>

          <TextField
            label={t('venueEditor.displayName')}
            value={selected.type === 'table' ? selected.label : venueDisplayLabel(t, selected)}
            editable={!selected.locked}
            onChangeText={(label) => updateDraft({ ...selected, label })}
            onBlur={() => void persist(selected)}
          />

          {selected.type === 'table' ? (
            <View style={styles.controlGroup}>
              <AppText variant="label">{t('venueEditor.tableShape')}</AppText>
              <View style={styles.controls}>
                <Button
                  label={t('venueEditor.round')}
                  variant={selected.shape === 'round' ? 'primary' : 'secondary'}
                  disabled={selected.locked}
                  onPress={() => changeSelected((item) => ({ ...item, shape: 'round' }))}
                />
                <Button
                  label={t('venueEditor.rectangle')}
                  variant={selected.shape === 'rectangle' ? 'primary' : 'secondary'}
                  disabled={selected.locked}
                  onPress={() => changeSelected((item) => ({ ...item, shape: 'rectangle' }))}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.controlGroup}>
            <AppText variant="label">{t('venueEditor.position')}</AppText>
            <View style={styles.controls}>
              <Button
                label="←"
                accessibilityLabel={t('venueEditor.moveLeft')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, -0.025, 0))}
              />
              <Button
                label="↑"
                accessibilityLabel={t('venueEditor.moveUp')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0, -0.025))}
              />
              <Button
                label="↓"
                accessibilityLabel={t('venueEditor.moveDown')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0, 0.025))}
              />
              <Button
                label="→"
                accessibilityLabel={t('venueEditor.moveRight')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => moveVenueLayoutItem(item, 0.025, 0))}
              />
            </View>
          </View>

          <View style={styles.controlGroup}>
            <AppText variant="label">{t('venueEditor.sizeAndAngle')}</AppText>
            <View style={styles.controls}>
              <Button
                label={t('venueEditor.narrower')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, -0.025, 0))}
              />
              <Button
                label={t('venueEditor.wider')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0.025, 0))}
              />
              <Button
                label={t('venueEditor.shorter')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0, -0.025))}
              />
              <Button
                label={t('venueEditor.taller')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => resizeVenueLayoutItem(item, 0, 0.025))}
              />
              <Button
                label="−15°"
                accessibilityLabel={t('venueEditor.rotateLeft')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => rotateVenueLayoutItem(item, -15))}
              />
              <Button
                label="+15°"
                accessibilityLabel={t('venueEditor.rotateRight')}
                variant="secondary"
                disabled={selected.locked}
                onPress={() => changeSelected((item) => rotateVenueLayoutItem(item, 15))}
              />
            </View>
          </View>

          <Button label={t('venueEditor.removeFromPlan')} variant="danger" onPress={confirmRemoveSelected} />
        </Card>
      ) : (
        <Card>
          <AppText variant="subtitle">{t('venueEditor.pickItem')}</AppText>
          <AppText color={theme.colors.muted}>{t('venueEditor.pickItemHint')}</AppText>
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
