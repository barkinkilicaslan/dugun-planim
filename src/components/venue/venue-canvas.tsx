import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { radius, spacing } from '@/constants/theme';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { tableOccupancy } from '@/domain/calculations';
import type { Guest, SeatingTable, VenueLayoutItem } from '@/domain/models';
import { moveVenueLayoutItem, shouldShowVenueCaption, venueDisplayLabel, venueItemLabel } from '@/domain/venue-layout';

interface CanvasSize {
  width: number;
  height: number;
}

interface VenueCanvasProps {
  items: VenueLayoutItem[];
  tables: SeatingTable[];
  guests: Guest[];
  selectedId?: string;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onDraftChange?: (item: VenueLayoutItem) => void;
  onMoveEnd?: (item: VenueLayoutItem) => void;
  compact?: boolean;
}

function DraggableVenueItem({
  item,
  canvasSize,
  tables,
  guests,
  selected,
  interactive,
  onSelect,
  onDraftChange,
  onMoveEnd,
}: {
  item: VenueLayoutItem;
  canvasSize: CanvasSize;
  tables: SeatingTable[];
  guests: Guest[];
  selected: boolean;
  interactive: boolean;
  onSelect?: (id: string) => void;
  onDraftChange?: (item: VenueLayoutItem) => void;
  onMoveEnd?: (item: VenueLayoutItem) => void;
}) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [drag, setDrag] = useState<{ pageX: number; pageY: number; origin: VenueLayoutItem }>();

  const table = item.tableId ? tables.find((candidate) => candidate.id === item.tableId) : undefined;
  const occupancy = table ? tableOccupancy(table.id, guests) : undefined;
  const label = table?.name ?? venueDisplayLabel(t, item);
  const description = table ? `${occupancy}/${table.capacity}` : venueItemLabel(t, item.type);
  const caption = item.locked ? t('venue.canvas.lockedBadge') : description;
  const showCaption = shouldShowVenueCaption(label, caption, item.height * canvasSize.height, Boolean(table));
  const backgroundColor =
    item.type === 'table'
      ? theme.colors.surface
      : item.type === 'danceFloor'
        ? theme.colors.surfaceAlt
        : theme.dark
          ? '#3B2C31'
          : '#F4E7D9';

  function finishDrag(pageX: number, pageY: number) {
    if (drag && !item.locked) {
      const deltaX = pageX - drag.pageX;
      const deltaY = pageY - drag.pageY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        onMoveEnd?.(moveVenueLayoutItem(drag.origin, deltaX / canvasSize.width, deltaY / canvasSize.height));
      }
    }
    setDrag(undefined);
  }

  return (
    <View
      onStartShouldSetResponder={() => interactive}
      onMoveShouldSetResponder={() => interactive}
      onResponderGrant={(event) => {
        if (!interactive) return;
        onSelect?.(item.id);
        setDrag({ pageX: event.nativeEvent.pageX, pageY: event.nativeEvent.pageY, origin: item });
      }}
      onResponderMove={(event) => {
        if (!drag || item.locked) return;
        const deltaX = event.nativeEvent.pageX - drag.pageX;
        const deltaY = event.nativeEvent.pageY - drag.pageY;
        onDraftChange?.(moveVenueLayoutItem(drag.origin, deltaX / canvasSize.width, deltaY / canvasSize.height));
      }}
      onResponderRelease={(event) => finishDrag(event.nativeEvent.pageX, event.nativeEvent.pageY)}
      onResponderTerminate={(event) => finishDrag(event.nativeEvent.pageX, event.nativeEvent.pageY)}
      onResponderTerminationRequest={() => false}
      accessible
      accessibilityRole={interactive ? 'button' : 'text'}
      accessibilityLabel={
        item.locked
          ? t('venue.canvas.itemLocked', { label, description })
          : t('venue.canvas.item', { label, description })
      }
      accessibilityHint={interactive ? t('venue.canvas.hint') : undefined}
      accessibilityState={{ selected }}
      accessibilityActions={interactive ? [{ name: 'activate', label: t('venue.canvas.selectAction') }] : undefined}
      onAccessibilityAction={interactive ? () => onSelect?.(item.id) : undefined}
      style={[
        styles.item,
        {
          left: item.x * canvasSize.width,
          top: item.y * canvasSize.height,
          width: item.width * canvasSize.width,
          height: item.height * canvasSize.height,
          backgroundColor,
          borderColor: selected ? theme.colors.accent : theme.colors.primary,
          borderWidth: selected ? 3 : 1.5,
          borderRadius: item.shape === 'round' ? 999 : radius.md,
          transform: [{ rotate: `${item.rotation}deg` }],
          opacity: item.locked ? 0.78 : 1,
        },
      ]}
    >
      <AppText variant="label" numberOfLines={2} style={styles.itemLabel}>
        {label}
      </AppText>
      {showCaption ? (
        <AppText variant="caption" color={theme.colors.muted} numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}
      {selected ? <View style={[styles.selectionDot, { backgroundColor: theme.colors.accent }]} /> : null}
    </View>
  );
}

export function VenueCanvas({
  items,
  tables,
  guests,
  selectedId,
  interactive = false,
  onSelect,
  onDraftChange,
  onMoveEnd,
  compact = false,
}: VenueCanvasProps) {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [size, setSize] = useState<CanvasSize>({ width: 320, height: compact ? 208 : 320 });

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ width, height });
  }

  return (
    <View
      testID="venue-canvas"
      accessibilityLabel={t('venue.canvas.label')}
      onLayout={handleLayout}
      style={[
        styles.canvas,
        compact ? styles.compactCanvas : styles.editorCanvas,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
      ]}
    >
      {Array.from({ length: 11 }, (_, index) => (
        <View
          key={`vertical-${index}`}
          pointerEvents="none"
          style={[
            styles.verticalGrid,
            { left: `${index * 10}%`, backgroundColor: theme.colors.border, opacity: theme.dark ? 0.22 : 0.45 },
          ]}
        />
      ))}
      {Array.from({ length: 9 }, (_, index) => (
        <View
          key={`horizontal-${index}`}
          pointerEvents="none"
          style={[
            styles.horizontalGrid,
            { top: `${index * 12.5}%`, backgroundColor: theme.colors.border, opacity: theme.dark ? 0.22 : 0.45 },
          ]}
        />
      ))}
      {!items.length ? (
        <View pointerEvents="none" style={styles.empty}>
          <AppText variant="subtitle">{t('venue.canvas.emptyTitle')}</AppText>
          <AppText color={theme.colors.muted} style={styles.emptyCopy}>
            {t('venue.canvas.emptyHint')}
          </AppText>
        </View>
      ) : null}
      {items.map((item) => (
        <DraggableVenueItem
          key={item.id}
          item={item}
          canvasSize={size}
          tables={tables}
          guests={guests}
          selected={selectedId === item.id}
          interactive={interactive}
          onSelect={onSelect}
          onDraftChange={onDraftChange}
          onMoveEnd={onMoveEnd}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: radius.lg,
    position: 'relative',
  },
  compactCanvas: { aspectRatio: 1.54 },
  editorCanvas: { aspectRatio: 1.2, minHeight: 300, maxHeight: 620 },
  verticalGrid: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  horizontalGrid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  item: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  itemLabel: { textAlign: 'center', fontSize: 12, lineHeight: 15 },
  selectionDot: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyCopy: { textAlign: 'center', maxWidth: 260 },
});
