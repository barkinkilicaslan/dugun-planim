import type { Guest, SeatingTable, VenueLayoutItem, VenueLayoutItemType } from './models';

const GRID_STEP = 0.025;
const MIN_SIZE = 0.1;

const DEFAULT_SIZES: Record<VenueLayoutItemType, { width: number; height: number }> = {
  table: { width: 0.18, height: 0.18 },
  stage: { width: 0.42, height: 0.14 },
  danceFloor: { width: 0.34, height: 0.25 },
  entrance: { width: 0.22, height: 0.1 },
  dj: { width: 0.18, height: 0.12 },
  service: { width: 0.24, height: 0.12 },
};

export const VENUE_ITEM_LABELS: Record<VenueLayoutItemType, string> = {
  table: 'Masa',
  stage: 'Sahne',
  danceFloor: 'Dans pisti',
  entrance: 'Giriş',
  dj: 'DJ',
  service: 'İkram',
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function snap(value: number): number {
  return Math.round(value / GRID_STEP) * GRID_STEP;
}

export function createVenueLayoutItem({
  id,
  type,
  index,
  now,
  label,
  tableId,
}: {
  id: string;
  type: VenueLayoutItemType;
  index: number;
  now: string;
  label?: string;
  tableId?: string;
}): VenueLayoutItem {
  const size = DEFAULT_SIZES[type];
  const column = index % 4;
  const row = Math.floor(index / 4) % 4;
  return {
    id,
    type,
    label: label?.trim() || VENUE_ITEM_LABELS[type],
    x: clamp(0.05 + column * 0.23, 0, 1 - size.width),
    y: clamp(0.08 + row * 0.22, 0, 1 - size.height),
    width: size.width,
    height: size.height,
    rotation: 0,
    shape: type === 'table' ? 'round' : 'rectangle',
    locked: false,
    tableId,
    createdAt: now,
    updatedAt: now,
  };
}

export function moveVenueLayoutItem(item: VenueLayoutItem, deltaX: number, deltaY: number): VenueLayoutItem {
  return {
    ...item,
    x: clamp(snap(item.x + deltaX), 0, 1 - item.width),
    y: clamp(snap(item.y + deltaY), 0, 1 - item.height),
  };
}

export function resizeVenueLayoutItem(item: VenueLayoutItem, widthDelta: number, heightDelta: number): VenueLayoutItem {
  const width = clamp(snap(item.width + widthDelta), MIN_SIZE, Math.min(0.75, 1 - item.x));
  const height = clamp(snap(item.height + heightDelta), MIN_SIZE, Math.min(0.75, 1 - item.y));
  return { ...item, width, height };
}

export function rotateVenueLayoutItem(item: VenueLayoutItem, delta: number): VenueLayoutItem {
  const rotation = (((item.rotation + delta) % 360) + 360) % 360;
  return { ...item, rotation };
}

export function venueLayoutSummary(items: VenueLayoutItem[]): string {
  const tableCount = items.filter((item) => item.type === 'table').length;
  const areaCount = items.length - tableCount;
  if (!items.length) return 'Henüz salon düzeni oluşturulmadı.';
  return `${tableCount} masa · ${areaCount} alan yerleştirildi`;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character,
  );
}

export function venueLayoutHtml(items: VenueLayoutItem[], tables: SeatingTable[], guests: Guest[]): string {
  if (!items.length) return '';
  const shapes = items
    .map((item) => {
      const table = item.tableId ? tables.find((candidate) => candidate.id === item.tableId) : undefined;
      const occupancy = table
        ? guests
            .filter((guest) => guest.tableId === table.id && guest.rsvp !== 'declined')
            .reduce((sum, guest) => sum + guest.partySize, 0)
        : undefined;
      const label = table ? `${table.name} ${occupancy}/${table.capacity}` : item.label;
      const borderRadius = item.shape === 'round' ? '999px' : '12px';
      const background = item.type === 'table' ? '#fffdfc' : item.type === 'danceFloor' ? '#ead9c4' : '#f3e8dc';
      return `<div style="position:absolute;left:${item.x * 100}%;top:${item.y * 100}%;width:${item.width * 100}%;height:${item.height * 100}%;transform:rotate(${item.rotation}deg);border:2px solid #6f1d3a;border-radius:${borderRadius};background:${background};display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;font-weight:700;padding:4px;box-sizing:border-box;overflow:hidden">${escapeHtml(label)}</div>`;
    })
    .join('');
  return `<h2>Salon düzeni</h2><div style="position:relative;width:100%;height:480px;border:2px solid #ded2c5;border-radius:16px;background:#f8f3ea;overflow:hidden">${shapes}</div>`;
}
