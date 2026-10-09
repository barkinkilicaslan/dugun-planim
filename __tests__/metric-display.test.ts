import { shouldCompactMetricValue } from '@/domain/metric-display';

describe('responsive summary metric values', () => {
  it('compacts long formatted amounts on phone-width screens', () => {
    expect(shouldCompactMetricValue('₺450.000,00', 393)).toBe(true);
    expect(shouldCompactMetricValue('$450,000.00', 393)).toBe(true);
  });

  it('keeps short values and roomy layouts at their normal size', () => {
    expect(shouldCompactMetricValue('₺0,00', 393)).toBe(false);
    expect(shouldCompactMetricValue('₺450.000,00', 768)).toBe(false);
  });
});
