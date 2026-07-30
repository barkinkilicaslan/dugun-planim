export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        couple1_name TEXT NOT NULL,
        couple2_name TEXT NOT NULL,
        wedding_date TEXT NOT NULL,
        estimated_budget_cents INTEGER NOT NULL CHECK (estimated_budget_cents >= 0),
        estimated_guest_count INTEGER NOT NULL CHECK (estimated_guest_count >= 0),
        currency TEXT NOT NULL,
        theme TEXT NOT NULL,
        date_format TEXT NOT NULL,
        notifications_enabled INTEGER NOT NULL,
        onboarding_completed INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
        email TEXT NOT NULL, quote_cents INTEGER NOT NULL CHECK (quote_cents >= 0),
        contract_status TEXT NOT NULL, payment_plan TEXT NOT NULL, notes TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS seating_tables (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, capacity INTEGER NOT NULL CHECK (capacity > 0),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guests (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, side TEXT NOT NULL,
        party_size INTEGER NOT NULL CHECK (party_size > 0), child_count INTEGER NOT NULL CHECK (child_count >= 0),
        rsvp TEXT NOT NULL, notes TEXT NOT NULL, meal_notes TEXT NOT NULL, guest_group TEXT NOT NULL,
        table_id TEXT REFERENCES seating_tables(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
        due_date TEXT NOT NULL, priority TEXT NOT NULL, completed INTEGER NOT NULL,
        notification_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS budget_items (
        id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL,
        planned_cents INTEGER NOT NULL CHECK (planned_cents >= 0),
        actual_cents INTEGER NOT NULL CHECK (actual_cents >= 0),
        paid_cents INTEGER NOT NULL CHECK (paid_cents >= 0 AND paid_cents <= actual_cents),
        due_date TEXT NOT NULL, vendor_id TEXT REFERENCES vendors(id) ON DELETE SET NULL,
        notes TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_guests_table_id ON guests(table_id);
      CREATE INDEX IF NOT EXISTS idx_budget_due_date ON budget_items(due_date);
    `,
  },
];

export function pendingMigrations(currentVersion: number): Migration[] {
  return MIGRATIONS.filter((migration) => migration.version > currentVersion).sort((a, b) => a.version - b.version);
}
