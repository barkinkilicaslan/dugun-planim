import { DatabaseSync } from 'node:sqlite';

import { MIGRATIONS, pendingMigrations } from '@/data/migrations';

describe('database migrations', () => {
  it('keeps versions ordered, unique and contiguous', () => {
    const versions = MIGRATIONS.map((migration) => migration.version);
    expect(versions).toEqual([...new Set(versions)]);
    expect(versions).toEqual(versions.map((_, index) => index + 1));
  });
  it('returns only pending migrations and includes integrity constraints', () => {
    expect(pendingMigrations(0)).toHaveLength(6);
    expect(pendingMigrations(1)).toHaveLength(5);
    expect(pendingMigrations(2)).toHaveLength(4);
    expect(pendingMigrations(3)).toHaveLength(3);
    expect(pendingMigrations(4)).toHaveLength(2);
    expect(pendingMigrations(5)).toHaveLength(1);
    expect(pendingMigrations(6)).toHaveLength(0);
    expect(MIGRATIONS[0].sql).toContain('PRAGMA foreign_keys = ON');
    expect(MIGRATIONS[0].sql).toContain('paid_cents <= actual_cents');
    expect(MIGRATIONS[0].sql).toContain('ON DELETE SET NULL');
    expect(MIGRATIONS[1].sql).toContain('venue_layout_items');
    expect(MIGRATIONS[1].sql).toContain('ON DELETE CASCADE');
    expect(MIGRATIONS[1].sql).toContain('table_id TEXT UNIQUE');
  });

  describe('version 3 on a real SQLite database', () => {
    function upgradedFromVersion2() {
      const db = new DatabaseSync(':memory:');
      for (const migration of pendingMigrations(0).filter((item) => item.version <= 2)) db.exec(migration.sql);
      db.exec(
        `INSERT INTO profile VALUES (1, 'Ada', 'Deniz', '2027-02-28', 100000, 80, 'TRY', 'system', 'DD.MM.YYYY', 0, 1);
         INSERT INTO guests VALUES ('g1', 'Aile Yılmaz', '0532 111 22 33', 'common', 4, 1, 'attending', 'not', 'vegan', 'family', NULL, 't0', 't0');
         INSERT INTO guests VALUES ('g2', 'Ece', '', 'couple1', 1, 0, 'pending', '', '', 'friends', NULL, 't0', 't0');`,
      );
      for (const migration of pendingMigrations(2)) db.exec(migration.sql);
      return db;
    }

    it('keeps existing guests and wedding date untouched and fills safe defaults', () => {
      const db = upgradedFromVersion2();
      const guest = db.prepare("SELECT * FROM guests WHERE id = 'g1'").get();
      expect(guest).toMatchObject({
        name: 'Aile Yılmaz',
        phone: '0532 111 22 33',
        party_size: 4,
        child_count: 1,
        rsvp: 'attending',
        email: '',
        rsvp_source: 'manual',
        rsvp_responded_at: '',
        invite_status: 'none',
        last_invite_channel: '',
      });
      expect(db.prepare("SELECT rsvp_source FROM guests WHERE id = 'g2'").get()).toEqual({ rsvp_source: 'none' });
      expect(db.prepare('SELECT wedding_date, adults_only, adults_only_message FROM profile').get()).toEqual({
        wedding_date: '2027-02-28',
        adults_only: 0,
        adults_only_message: '',
      });
      expect(db.prepare('SELECT COUNT(*) AS total FROM invitation_designs').get()).toEqual({ total: 0 });
      db.close();
    });
  });
});
