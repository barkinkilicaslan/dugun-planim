import { formatMoneyInput, MAX_MONEY_CENTS, parseMoney } from '@/domain/money';
import { validateBudgetItem, validateProfile, validateVendor, ValidationError } from '@/domain/validation';
import { EMPTY_PROFILE, type BudgetItem, type Vendor } from '@/domain/models';

const cents = (text: string, locale = 'tr') => parseMoney(text, locale)?.cents;

describe('parseMoney (Türkçe: virgül ondalık, nokta binlik)', () => {
  it.each([
    ['12', 1200],
    ['12,5', 1250],
    ['12,50', 1250],
    ['0,5', 50],
    ['0,05', 5],
    [',5', 50],
    ['12,', 1200],
    ['0', 0],
    ['1.500', 150000],
    ['1.250,50', 125050],
    ['1.250.000', 125000000],
    ['1.250.000,99', 125000099],
    ['12.5', 1250], // gruplanmamış tek nokta: Android/İngilizce klavyeden gelen ondalık
    ['1,250.50', 125050], // iki ayırıcı birlikte: sonuncusu ondalık
    [' 1 250,5 ', 125050],
    ['1 250,5', 125050],
  ])('%j → %i kuruş', (text, expected) => {
    expect(cents(text)).toBe(expected);
  });

  it('boş girdiyi "boş" olarak bildirir, sıfıra çevirip gizlemez', () => {
    expect(parseMoney('', 'tr')).toEqual({ cents: 0, empty: true });
    expect(parseMoney('   ', 'tr')).toEqual({ cents: 0, empty: true });
    expect(parseMoney('0', 'tr')).toEqual({ cents: 0, empty: false });
  });

  it.each(['abc', '12abc', '-5', '+5', '1e3', '0x10', 'Infinity', '12,5,5', '1,2,3', '١٢', '12,555', '1.5.5.5'])(
    'geçersiz girdiyi %j reddeder (sessizce sıfıra çevirmez)',
    (text) => {
      expect(parseMoney(text, 'tr')).toBeNull();
    },
  );

  it('üst sınırı uygular', () => {
    expect(cents('1.000.000.000')).toBe(MAX_MONEY_CENTS);
    expect(parseMoney('1.000.000.001', 'tr')).toBeNull();
    expect(parseMoney('99999999999999999999', 'tr')).toBeNull();
  });
});

describe('parseMoney (İngilizce: nokta ondalık, virgül binlik)', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['0.5', 50],
    ['1,500', 150000],
    ['1,250.50', 125050],
    ['12,5', 1250], // gruplanmamış tek virgül ondalık sayılır
    ['1.250,50', 125050],
  ])('%j → %i kuruş', (text, expected) => {
    expect(cents(text, 'en')).toBe(expected);
  });
});

describe('formatMoneyInput', () => {
  it('düzenleme alanı için binliksiz ve gereksiz sıfırsız metin üretir', () => {
    expect(formatMoneyInput(0, 'tr')).toBe('');
    expect(formatMoneyInput(1200, 'tr')).toBe('12');
    expect(formatMoneyInput(1250, 'tr')).toBe('12,5');
    expect(formatMoneyInput(1205, 'tr')).toBe('12,05');
    expect(formatMoneyInput(50, 'tr')).toBe('0,5');
    expect(formatMoneyInput(125050, 'tr')).toBe('1250,5');
    expect(formatMoneyInput(1250, 'en')).toBe('12.5');
    expect(formatMoneyInput(Number.NaN, 'tr')).toBe('');
    expect(formatMoneyInput(-5, 'tr')).toBe('');
  });

  it('saklanan kuruşu kayıpsız geri okur (her iki dilde)', () => {
    for (const locale of ['tr', 'en']) {
      for (const value of [1, 5, 50, 99, 100, 101, 1250, 125050, 99999999999, MAX_MONEY_CENTS]) {
        expect(parseMoney(formatMoneyInput(value, locale), locale)?.cents).toBe(value);
      }
    }
  });
});

describe('tutar doğrulaması', () => {
  const budget: BudgetItem = {
    id: 'b1',
    category: 'Mekân',
    title: 'Salon',
    plannedCents: 100,
    actualCents: 100,
    paidCents: 0,
    dueDate: '',
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const vendor: Vendor = {
    id: 'v1',
    name: 'Foto',
    category: 'Fotoğraf',
    phone: '',
    email: '',
    quoteCents: 100,
    contractStatus: 'researching',
    paymentPlan: '',
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('üst sınırı aşan tutarı bütçe kalemi, tedarikçi ve profilde reddeder', () => {
    expect(() => validateBudgetItem({ ...budget, actualCents: MAX_MONEY_CENTS + 1 })).toThrow(ValidationError);
    expect(() => validateBudgetItem({ ...budget, plannedCents: 1e22 })).toThrow(ValidationError);
    expect(() => validateVendor({ ...vendor, quoteCents: MAX_MONEY_CENTS + 1 })).toThrow(ValidationError);
    const profile = { ...EMPTY_PROFILE, couple1Name: 'A', couple2Name: 'B', weddingDate: '2027-06-12' };
    expect(() => validateProfile({ ...profile, estimatedBudgetCents: MAX_MONEY_CENTS + 1 })).toThrow(ValidationError);
    expect(validateProfile({ ...profile, estimatedBudgetCents: MAX_MONEY_CENTS }).estimatedBudgetCents).toBe(
      MAX_MONEY_CENTS,
    );
  });
});
