import {
  createVenueLayoutItem,
  moveVenueLayoutItem,
  resizeVenueLayoutItem,
  rotateVenueLayoutItem,
  venueLayoutHtml,
  venueLayoutSummary,
} from '@/domain/venue-layout';
import type { Guest, SeatingTable } from '@/domain/models';
import { GUEST_DEFAULTS, TR } from './fixtures';

const now = '2026-08-01T12:00:00.000Z';

describe('customizable venue layout', () => {
  it('creates normalized table items linked to an existing seating table', () => {
    const item = createVenueLayoutItem({
      id: 'layout-1',
      type: 'table',
      index: 0,
      now,
      label: 'Masa 1',
      tableId: 't1',
    });
    expect(item).toMatchObject({ type: 'table', tableId: 't1', shape: 'round', width: 0.18, height: 0.18 });
    expect(item.x + item.width).toBeLessThanOrEqual(1);
    expect(item.y + item.height).toBeLessThanOrEqual(1);
  });

  it('snaps movement to the grid and keeps an item inside the canvas', () => {
    const item = createVenueLayoutItem({ id: 'stage', type: 'stage', index: 0, now });
    const snapped = moveVenueLayoutItem(item, 0.037, 0.041);
    expect(snapped.x).toBeCloseTo(0.075);
    expect(snapped.y).toBeCloseTo(0.125);
    const moved = moveVenueLayoutItem(item, 2, -2);
    expect(moved.x).toBeCloseTo(1 - item.width);
    expect(moved.y).toBe(0);
  });

  it('enforces useful size bounds and normalizes rotation', () => {
    const item = createVenueLayoutItem({ id: 'dance', type: 'danceFloor', index: 1, now });
    expect(resizeVenueLayoutItem(item, -2, -2)).toMatchObject({ width: 0.1, height: 0.1 });
    expect(rotateVenueLayoutItem(item, -15).rotation).toBe(345);
    expect(rotateVenueLayoutItem(item, 375).rotation).toBe(15);
  });

  it('renders a safe visual plan with live occupancy in PDF HTML', () => {
    const table: SeatingTable = { id: 't1', name: '<Masa 1>', capacity: 8, createdAt: now, updatedAt: now };
    const guest: Guest = {
      id: 'g1',
      name: 'Ada',
      phone: '',
      side: 'common',
      partySize: 2,
      childCount: 0,
      rsvp: 'attending',
      notes: '',
      mealNotes: '',
      group: 'friends',
      ...GUEST_DEFAULTS,
      tableId: 't1',
      createdAt: now,
      updatedAt: now,
    };
    const item = createVenueLayoutItem({ id: 'layout-1', type: 'table', index: 0, now, tableId: 't1' });
    const html = venueLayoutHtml([item], [table], [guest], TR.t);
    expect(html).toContain('&lt;Masa 1&gt; 2/8');
    expect(html).not.toContain('<Masa 1>');
    expect(venueLayoutSummary([item], TR.t)).toBe('1 masa · 0 alan yerleştirildi');
  });
});
