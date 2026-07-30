import { MIGRATIONS, pendingMigrations } from '@/data/migrations';

describe('database migrations', () => {
  it('keeps versions ordered, unique and contiguous', () => {
    const versions = MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual([...new Set(versions)]);
    expect(versions).toEqual(versions.map((_, index) => index + 1));
  });
  it('returns only pending migrations and includes integrity constraints', () => {
    expect(pendingMigrations(0)).toHaveLength(1);
    expect(pendingMigrations(1)).toHaveLength(0);
    expect(MIGRATIONS[0].sql).toContain('PRAGMA foreign_keys = ON');
    expect(MIGRATIONS[0].sql).toContain('paid_cents <= actual_cents');
    expect(MIGRATIONS[0].sql).toContain('ON DELETE SET NULL');
  });
});
