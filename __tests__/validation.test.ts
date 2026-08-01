import { formatDate } from '@/domain/calculations';
import { EMPTY_APP_DATA, type BudgetItem, type VenueLayoutItem, type WeddingProfile } from '@/domain/models';
import { validateAppData, validateBudgetItem, validateProfile, ValidationError } from '@/domain/validation';

const profile: WeddingProfile = {
  couple1Name: 'Ece',
  couple2Name: 'Mert',
  weddingDate: '2027-06-12',
  estimatedBudgetCents: 100_000,
  estimatedGuestCount: 80,
  currency: 'TRY',
  theme: 'system',
  dateFormat: 'DD.MM.YYYY',
  notificationsEnabled: false,
  onboardingCompleted: true,
};

it('rejects calendar rollover dates', () => {
  expect(() => validateProfile({ ...profile, weddingDate: '2027-02-31' })).toThrow(ValidationError);
});

it('rejects a paid amount above the actual amount', () => {
  const item: BudgetItem = {
    id: 'b1',
    category: 'Mekân',
    title: 'Salon',
    plannedCents: 100_000,
    actualCents: 90_000,
    paidCents: 95_000,
    dueDate: '',
    notes: '',
    createdAt: '2026-07-30T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
  };
  expect(() => validateBudgetItem(item)).toThrow('Ödenen tutar gerçekleşen tutarı aşamaz.');
});

it('formats dates from the saved preference', () => {
  expect(formatDate('2027-06-12', 'DD.MM.YYYY')).toBe('12.06.2027');
  expect(formatDate('2027-06-12', 'YYYY-MM-DD')).toBe('2027-06-12');
});

it('rejects a venue table item that points to a missing seating table', () => {
  const layoutItem: VenueLayoutItem = {
    id: 'layout-1',
    type: 'table',
    label: 'Masa 1',
    x: 0.1,
    y: 0.1,
    width: 0.2,
    height: 0.2,
    rotation: 0,
    shape: 'round',
    locked: false,
    tableId: 'missing',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
  expect(() => validateAppData({ ...EMPTY_APP_DATA, venueLayoutItems: [layoutItem] })).toThrow('masa kaydı bulunamadı');
});
