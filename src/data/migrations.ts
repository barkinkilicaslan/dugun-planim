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
  {
    version: 2,
    name: 'customizable_venue_layout',
    sql: `
      CREATE TABLE IF NOT EXISTS venue_layout_items (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL CHECK (item_type IN ('table', 'stage', 'danceFloor', 'entrance', 'dj', 'service')),
        label TEXT NOT NULL,
        x REAL NOT NULL CHECK (x >= 0 AND x <= 1),
        y REAL NOT NULL CHECK (y >= 0 AND y <= 1),
        width REAL NOT NULL CHECK (width > 0 AND width <= 1),
        height REAL NOT NULL CHECK (height > 0 AND height <= 1),
        rotation INTEGER NOT NULL,
        shape TEXT NOT NULL CHECK (shape IN ('round', 'rectangle')),
        locked INTEGER NOT NULL DEFAULT 0,
        table_id TEXT UNIQUE REFERENCES seating_tables(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_venue_layout_item_type ON venue_layout_items(item_type);
    `,
  },
  {
    // Mevcut kayıtlar korunur: yalnız varsayılanlı sütunlar eklenir; wedding_date (YYYY-AA-GG) olduğu gibi kalır.
    version: 3,
    name: 'rsvp_invitations_adults_only',
    sql: `
      ALTER TABLE profile ADD COLUMN adults_only INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE profile ADD COLUMN adults_only_message TEXT NOT NULL DEFAULT '';
      ALTER TABLE guests ADD COLUMN email TEXT NOT NULL DEFAULT '';
      ALTER TABLE guests ADD COLUMN rsvp_source TEXT NOT NULL DEFAULT 'none';
      ALTER TABLE guests ADD COLUMN rsvp_responded_at TEXT NOT NULL DEFAULT '';
      ALTER TABLE guests ADD COLUMN last_invite_sent_at TEXT NOT NULL DEFAULT '';
      ALTER TABLE guests ADD COLUMN last_invite_channel TEXT NOT NULL DEFAULT '';
      ALTER TABLE guests ADD COLUMN invite_status TEXT NOT NULL DEFAULT 'none';
      UPDATE guests SET rsvp_source = 'manual' WHERE rsvp <> 'pending';
      CREATE TABLE IF NOT EXISTS invitation_designs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT NOT NULL,
        palette_id TEXT NOT NULL,
        couple_names TEXT NOT NULL,
        wedding_date TEXT NOT NULL,
        wedding_time TEXT NOT NULL,
        venue_name TEXT NOT NULL,
        venue_address TEXT NOT NULL,
        message TEXT NOT NULL,
        rsvp_deadline TEXT NOT NULL,
        adults_only_message TEXT NOT NULL,
        photo_uri TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    // Yalnız yeni tablo eklenir; mevcut kayıtlara dokunulmaz.
    version: 4,
    name: 'personal_invitations',
    sql: `
      CREATE TABLE IF NOT EXISTS personal_invitations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 5,
    name: 'task_suggestion_ids',
    sql: `ALTER TABLE tasks ADD COLUMN suggestion_id TEXT;`,
  },
  {
    version: 6,
    name: 'task_cleanup_marker',
    sql: `CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`,
  },
];

export function pendingMigrations(currentVersion: number): Migration[] {
  return MIGRATIONS.filter((migration) => migration.version > currentVersion).sort((a, b) => a.version - b.version);
}
