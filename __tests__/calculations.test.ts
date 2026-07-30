import {
  budgetSummary,
  canAssignGuest,
  categoryDistribution,
  daysUntil,
  guestSummary,
  tableOccupancy,
  taskProgress,
} from '@/domain/calculations';
import type { BudgetItem, Guest, SeatingTable, TaskItem } from '@/domain/models';

const timestamp = '2026-07-30T10:00:00.000Z';
const guest = (overrides: Partial<Guest> = {}): Guest => ({
  id: 'g1',
  name: 'Aile',
  phone: '',
  side: 'common',
  partySize: 2,
  childCount: 1,
  rsvp: 'pending',
  notes: '',
  mealNotes: '',
  group: 'family',
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});
const budget = (overrides: Partial<BudgetItem> = {}): BudgetItem => ({
  id: 'b1',
  category: 'Mekân',
  title: 'Salon',
  plannedCents: 100_00,
  actualCents: 120_00,
  paidCents: 50_00,
  dueDate: '2026-08-30',
  notes: '',
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
});

describe('financial calculations', () => {
  it('calculates totals, payments and over-budget values in integer cents', () => {
    const summary = budgetSummary(
      [budget(), budget({ id: 'b2', category: 'Müzik', actualCents: 50_00, plannedCents: 45_00, paidCents: 50_00 })],
      150_00,
    );
    expect(summary).toMatchObject({
      plannedCents: 145_00,
      actualCents: 170_00,
      paidCents: 100_00,
      remainingPaymentsCents: 70_00,
      availableCents: -20_00,
      overBudgetCents: 20_00,
    });
  });
  it('groups actual spending by category in descending order', () => {
    expect(
      categoryDistribution([
        budget(),
        budget({ id: 'b2', actualCents: 30_00 }),
        budget({ id: 'b3', category: 'Müzik', actualCents: 80_00 }),
      ]),
    ).toEqual([
      { category: 'Mekân', cents: 150_00 },
      { category: 'Müzik', cents: 80_00 },
    ]);
  });
});

describe('guest and seating calculations', () => {
  it('counts invitations, people, children and RSVP people correctly', () => {
    expect(
      guestSummary([
        guest(),
        guest({ id: 'g2', partySize: 3, childCount: 0, rsvp: 'attending' }),
        guest({ id: 'g3', partySize: 1, childCount: 0, rsvp: 'declined' }),
      ]),
    ).toEqual({ invitations: 3, people: 6, children: 1, attending: 3, pending: 2, declined: 1 });
  });
  it('prevents assignments that exceed table capacity and ignores declined people in occupancy', () => {
    const table: SeatingTable = { id: 't1', name: 'Masa 1', capacity: 4, createdAt: timestamp, updatedAt: timestamp };
    const guests = [
      guest({ tableId: 't1', partySize: 3 }),
      guest({ id: 'g2', tableId: 't1', partySize: 4, rsvp: 'declined' }),
    ];
    expect(tableOccupancy('t1', guests)).toBe(3);
    expect(canAssignGuest(table, guest({ id: 'candidate', partySize: 2 }), guests)).toBe(false);
    expect(canAssignGuest(table, guest({ id: 'candidate', partySize: 1 }), guests)).toBe(true);
  });
});

describe('date and progress calculations', () => {
  it('uses local calendar days across daylight-saving-sized time differences', () => {
    expect(daysUntil('2026-03-30', new Date('2026-03-28T23:30:00+03:00'))).toBe(2);
    expect(daysUntil('2026-03-27', new Date('2026-03-28T01:00:00+03:00'))).toBe(-1);
  });
  it('returns a stable zero for invalid/empty date and progress for empty tasks', () => {
    expect(daysUntil('')).toBe(0);
    expect(taskProgress([])).toEqual({ completed: 0, remaining: 0, percentage: 0 });
  });
  it('rounds task progress consistently', () => {
    const tasks = [true, false, false].map((completed, index) => ({ id: String(index), completed }) as TaskItem);
    expect(taskProgress(tasks)).toEqual({ completed: 1, remaining: 2, percentage: 33 });
  });
});
