import { act, fireEvent, render } from '@testing-library/react-native';

import { VenueCanvas } from '@/components/venue/venue-canvas';
import { createVenueLayoutItem } from '@/domain/venue-layout';
import type { Guest, SeatingTable } from '@/domain/models';

jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    dark: false,
    colors: {
      background: '#f8f3ea',
      surface: '#fff',
      surfaceAlt: '#eee',
      primary: '#6f1d3a',
      accent: '#c7a86b',
      text: '#222',
      muted: '#666',
      border: '#ddd',
    },
  }),
}));

const now = '2026-08-01T12:00:00.000Z';
const table: SeatingTable = { id: 't1', name: 'Masa 1', capacity: 8, createdAt: now, updatedAt: now };
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
  tableId: 't1',
  createdAt: now,
  updatedAt: now,
};

describe('VenueCanvas', () => {
  it('exposes linked table occupancy and selection to assistive technology', async () => {
    const onSelect = jest.fn();
    const item = createVenueLayoutItem({ id: 'layout-1', type: 'table', index: 0, now, tableId: 't1' });
    const view = await render(
      <VenueCanvas items={[item]} tables={[table]} guests={[guest]} interactive onSelect={onSelect} />,
    );
    const tableItem = view.getByLabelText('Masa 1, 2/8');
    fireEvent(tableItem, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(onSelect).toHaveBeenCalledWith('layout-1');
  });

  it('renders an explanatory empty state', async () => {
    const view = await render(<VenueCanvas items={[]} tables={[]} guests={[]} />);
    expect(view.getByText('Boş salon')).toBeTruthy();
  });

  it('reports snapped draft and final positions after dragging', async () => {
    const onDraftChange = jest.fn();
    const onMoveEnd = jest.fn();
    const item = createVenueLayoutItem({ id: 'layout-1', type: 'table', index: 0, now, tableId: 't1' });
    const view = await render(
      <VenueCanvas
        items={[item]}
        tables={[table]}
        guests={[]}
        interactive
        onDraftChange={onDraftChange}
        onMoveEnd={onMoveEnd}
      />,
    );
    const tableItem = view.getByLabelText('Masa 1, 0/8');
    await act(async () => fireEvent(tableItem, 'responderGrant', { nativeEvent: { pageX: 100, pageY: 100 } }));
    await act(async () => fireEvent(tableItem, 'responderMove', { nativeEvent: { pageX: 120, pageY: 100 } }));
    await act(async () => fireEvent(tableItem, 'responderRelease', { nativeEvent: { pageX: 120, pageY: 100 } }));

    expect(onDraftChange).toHaveBeenCalledTimes(1);
    expect(onMoveEnd).toHaveBeenCalledTimes(1);
    expect(onDraftChange.mock.calls[0][0].x).toBeCloseTo(0.125);
    expect(onDraftChange.mock.calls[0][0].y).toBeCloseTo(0.075);
    expect(onMoveEnd.mock.calls[0][0].x).toBeCloseTo(0.125);
    expect(onMoveEnd.mock.calls[0][0].y).toBeCloseTo(0.075);
  });
});
