import { formatDate } from '@/domain/calculations';
import type { BudgetItem, WeddingProfile } from '@/domain/models';
import { validateBudgetItem, validateProfile, ValidationError } from '@/domain/validation';

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
