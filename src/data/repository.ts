import * as SQLite from 'expo-sqlite';

import {
  EMPTY_APP_DATA,
  EMPTY_PROFILE,
  type AppData,
  type BudgetItem,
  type Guest,
  type InvitationDesign,
  type NoteItem,
  type PersonalInvitation,
  type SeatingTable,
  type TaskItem,
  type Vendor,
  type VenueLayoutItem,
  type WeddingProfile,
} from '@/domain/models';
import { pendingMigrations } from './migrations';
import { findLegacyAutoTaskIds } from '@/domain/templates';

type Db = SQLite.SQLiteDatabase;
let databasePromise: Promise<Db> | undefined;

async function database(): Promise<Db> {
  databasePromise ??= SQLite.openDatabaseAsync('dugun-planim.db');
  return databasePromise;
}

async function migrate(db: Db): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (const migration of pendingMigrations(row?.user_version ?? 0)) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

async function cleanLegacyOverdueTasks(db: Db): Promise<void> {
  const marker = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'legacy_task_cleanup_v1'",
  );
  if (marker) return;
  const profile = await db.getFirstAsync<{ wedding_date: string }>('SELECT wedding_date FROM profile WHERE id = 1');
  if (profile?.wedding_date) {
    const rows = await db.getAllAsync<Record<string, string | number | null>>('SELECT * FROM tasks');
    const tasks: TaskItem[] = rows.map((r) => ({
      id: String(r.id),
      category: String(r.category),
      title: String(r.title),
      description: String(r.description),
      dueDate: String(r.due_date),
      priority: String(r.priority) as TaskItem['priority'],
      completed: Boolean(r.completed),
      notificationId: r.notification_id ? String(r.notification_id) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
    const ids = findLegacyAutoTaskIds(tasks, profile.wedding_date);
    if (ids.length) await db.runAsync(`DELETE FROM tasks WHERE id IN (${ids.map(() => '?').join(',')})`, ...ids);
  }
  await db.runAsync(
    "INSERT INTO app_meta (key, value) VALUES ('legacy_task_cleanup_v1', 'done') ON CONFLICT(key) DO UPDATE SET value='done'",
  );
}

async function saveProfileWithDb(db: Db, profile: WeddingProfile): Promise<void> {
  await db.runAsync(
    `INSERT INTO profile (id, couple1_name, couple2_name, wedding_date, estimated_budget_cents, estimated_guest_count, currency, theme, date_format, notifications_enabled, onboarding_completed, adults_only, adults_only_message)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET couple1_name=excluded.couple1_name, couple2_name=excluded.couple2_name,
     wedding_date=excluded.wedding_date, estimated_budget_cents=excluded.estimated_budget_cents,
     estimated_guest_count=excluded.estimated_guest_count, currency=excluded.currency, theme=excluded.theme,
     date_format=excluded.date_format, notifications_enabled=excluded.notifications_enabled,
     onboarding_completed=excluded.onboarding_completed, adults_only=excluded.adults_only,
     adults_only_message=excluded.adults_only_message`,
    profile.couple1Name,
    profile.couple2Name,
    profile.weddingDate,
    profile.estimatedBudgetCents,
    profile.estimatedGuestCount,
    profile.currency,
    profile.theme,
    profile.dateFormat,
    profile.notificationsEnabled ? 1 : 0,
    profile.onboardingCompleted ? 1 : 0,
    profile.adultsOnly ? 1 : 0,
    profile.adultsOnlyMessage,
  );
}

async function upsertTaskWithDb(db: Db, task: TaskItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO tasks (id, category, title, description, due_date, priority, completed, notification_id, created_at, updated_at, suggestion_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET category=excluded.category,title=excluded.title,description=excluded.description,due_date=excluded.due_date,priority=excluded.priority,completed=excluded.completed,notification_id=excluded.notification_id,updated_at=excluded.updated_at,suggestion_id=excluded.suggestion_id`,
    task.id,
    task.category,
    task.title,
    task.description,
    task.dueDate,
    task.priority,
    task.completed ? 1 : 0,
    task.notificationId ?? null,
    task.createdAt,
    task.updatedAt,
    task.suggestionId ?? null,
  );
}

async function upsertGuestWithDb(db: Db, guest: Guest): Promise<void> {
  await db.runAsync(
    `INSERT INTO guests (id, name, phone, email, side, party_size, child_count, rsvp, notes, meal_notes, guest_group, table_id,
       rsvp_source, rsvp_responded_at, last_invite_sent_at, last_invite_channel, invite_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name,phone=excluded.phone,email=excluded.email,side=excluded.side,
     party_size=excluded.party_size,child_count=excluded.child_count,rsvp=excluded.rsvp,notes=excluded.notes,
     meal_notes=excluded.meal_notes,guest_group=excluded.guest_group,table_id=excluded.table_id,
     rsvp_source=excluded.rsvp_source,rsvp_responded_at=excluded.rsvp_responded_at,
     last_invite_sent_at=excluded.last_invite_sent_at,last_invite_channel=excluded.last_invite_channel,
     invite_status=excluded.invite_status,updated_at=excluded.updated_at`,
    guest.id,
    guest.name,
    guest.phone,
    guest.email,
    guest.side,
    guest.partySize,
    guest.childCount,
    guest.rsvp,
    guest.notes,
    guest.mealNotes,
    guest.group,
    guest.tableId ?? null,
    guest.rsvpSource,
    guest.rsvpRespondedAt,
    guest.lastInviteSentAt,
    guest.lastInviteChannel,
    guest.inviteStatus,
    guest.createdAt,
    guest.updatedAt,
  );
}

async function upsertTableWithDb(db: Db, table: SeatingTable): Promise<void> {
  await db.runAsync(
    `INSERT INTO seating_tables VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,capacity=excluded.capacity,updated_at=excluded.updated_at`,
    table.id,
    table.name,
    table.capacity,
    table.createdAt,
    table.updatedAt,
  );
}

async function upsertVenueLayoutItemWithDb(db: Db, item: VenueLayoutItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO venue_layout_items (id, item_type, label, x, y, width, height, rotation, shape, locked, table_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET item_type=excluded.item_type,label=excluded.label,x=excluded.x,y=excluded.y,
     width=excluded.width,height=excluded.height,rotation=excluded.rotation,shape=excluded.shape,locked=excluded.locked,
     table_id=excluded.table_id,updated_at=excluded.updated_at`,
    item.id,
    item.type,
    item.label,
    item.x,
    item.y,
    item.width,
    item.height,
    item.rotation,
    item.shape,
    item.locked ? 1 : 0,
    item.tableId ?? null,
    item.createdAt,
    item.updatedAt,
  );
}

async function upsertBudgetWithDb(db: Db, item: BudgetItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO budget_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET category=excluded.category,title=excluded.title,planned_cents=excluded.planned_cents,actual_cents=excluded.actual_cents,paid_cents=excluded.paid_cents,due_date=excluded.due_date,vendor_id=excluded.vendor_id,notes=excluded.notes,updated_at=excluded.updated_at`,
    item.id,
    item.category,
    item.title,
    item.plannedCents,
    item.actualCents,
    item.paidCents,
    item.dueDate,
    item.vendorId ?? null,
    item.notes,
    item.createdAt,
    item.updatedAt,
  );
}

async function upsertVendorWithDb(db: Db, vendor: Vendor): Promise<void> {
  await db.runAsync(
    `INSERT INTO vendors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET category=excluded.category,name=excluded.name,phone=excluded.phone,email=excluded.email,quote_cents=excluded.quote_cents,contract_status=excluded.contract_status,payment_plan=excluded.payment_plan,notes=excluded.notes,updated_at=excluded.updated_at`,
    vendor.id,
    vendor.category,
    vendor.name,
    vendor.phone,
    vendor.email,
    vendor.quoteCents,
    vendor.contractStatus,
    vendor.paymentPlan,
    vendor.notes,
    vendor.createdAt,
    vendor.updatedAt,
  );
}

async function upsertInvitationDesignWithDb(db: Db, design: InvitationDesign): Promise<void> {
  await db.runAsync(
    `INSERT INTO invitation_designs (id, name, template_id, palette_id, couple_names, wedding_date, wedding_time, venue_name,
       venue_address, message, rsvp_deadline, adults_only_message, photo_uri, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name,template_id=excluded.template_id,palette_id=excluded.palette_id,
     couple_names=excluded.couple_names,wedding_date=excluded.wedding_date,wedding_time=excluded.wedding_time,
     venue_name=excluded.venue_name,venue_address=excluded.venue_address,message=excluded.message,
     rsvp_deadline=excluded.rsvp_deadline,adults_only_message=excluded.adults_only_message,photo_uri=excluded.photo_uri,
     is_default=excluded.is_default,updated_at=excluded.updated_at`,
    design.id,
    design.name,
    design.templateId,
    design.paletteId,
    design.coupleNames,
    design.weddingDate,
    design.weddingTime,
    design.venueName,
    design.venueAddress,
    design.message,
    design.rsvpDeadline,
    design.adultsOnlyMessage,
    design.photoUri,
    design.isDefault ? 1 : 0,
    design.createdAt,
    design.updatedAt,
  );
}

async function upsertPersonalInvitationWithDb(db: Db, item: PersonalInvitation): Promise<void> {
  await db.runAsync(
    `INSERT INTO personal_invitations (id, name, image_uri, width, height, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name,image_uri=excluded.image_uri,width=excluded.width,
     height=excluded.height,updated_at=excluded.updated_at`,
    item.id,
    item.name,
    item.imageUri,
    item.width,
    item.height,
    item.createdAt,
    item.updatedAt,
  );
}

async function upsertNoteWithDb(db: Db, note: NoteItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO notes VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,content=excluded.content,updated_at=excluded.updated_at`,
    note.id,
    note.title,
    note.content,
    note.createdAt,
    note.updatedAt,
  );
}

export const repository = {
  async initialize(): Promise<void> {
    const db = await database();
    await migrate(db);
    await cleanLegacyOverdueTasks(db);
  },

  async load(): Promise<AppData> {
    const db = await database();
    const profileRow = await db.getFirstAsync<Record<string, string | number>>('SELECT * FROM profile WHERE id = 1');
    const taskRows = await db.getAllAsync<Record<string, string | number | null>>(
      'SELECT * FROM tasks ORDER BY due_date, created_at',
    );
    const guestRows = await db.getAllAsync<Record<string, string | number | null>>(
      'SELECT * FROM guests ORDER BY name COLLATE NOCASE',
    );
    const tableRows = await db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM seating_tables ORDER BY name COLLATE NOCASE',
    );
    const venueLayoutRows = await db.getAllAsync<Record<string, string | number | null>>(
      'SELECT * FROM venue_layout_items ORDER BY created_at',
    );
    const budgetRows = await db.getAllAsync<Record<string, string | number | null>>(
      'SELECT * FROM budget_items ORDER BY due_date, created_at',
    );
    const vendorRows = await db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM vendors ORDER BY name COLLATE NOCASE',
    );
    const noteRows = await db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM notes ORDER BY updated_at DESC',
    );
    const designRows = await db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM invitation_designs ORDER BY created_at',
    );
    const personalRows = await db.getAllAsync<Record<string, string | number>>(
      'SELECT * FROM personal_invitations ORDER BY created_at',
    );
    return {
      profile: profileRow
        ? {
            couple1Name: String(profileRow.couple1_name),
            couple2Name: String(profileRow.couple2_name),
            weddingDate: String(profileRow.wedding_date),
            estimatedBudgetCents: Number(profileRow.estimated_budget_cents),
            estimatedGuestCount: Number(profileRow.estimated_guest_count),
            currency: String(profileRow.currency) as WeddingProfile['currency'],
            theme: String(profileRow.theme) as WeddingProfile['theme'],
            dateFormat: String(profileRow.date_format) as WeddingProfile['dateFormat'],
            notificationsEnabled: Boolean(profileRow.notifications_enabled),
            onboardingCompleted: Boolean(profileRow.onboarding_completed),
            adultsOnly: Boolean(profileRow.adults_only),
            adultsOnlyMessage: String(profileRow.adults_only_message ?? ''),
          }
        : { ...EMPTY_PROFILE },
      tasks: taskRows.map((r) => ({
        id: String(r.id),
        category: String(r.category),
        title: String(r.title),
        description: String(r.description),
        dueDate: String(r.due_date),
        priority: String(r.priority) as TaskItem['priority'],
        completed: Boolean(r.completed),
        notificationId: r.notification_id ? String(r.notification_id) : undefined,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
        suggestionId: r.suggestion_id ? String(r.suggestion_id) : undefined,
      })),
      guests: guestRows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        phone: String(r.phone),
        email: String(r.email ?? ''),
        side: String(r.side) as Guest['side'],
        partySize: Number(r.party_size),
        childCount: Number(r.child_count),
        rsvp: String(r.rsvp) as Guest['rsvp'],
        notes: String(r.notes),
        mealNotes: String(r.meal_notes),
        group: String(r.guest_group) as Guest['group'],
        tableId: r.table_id ? String(r.table_id) : undefined,
        rsvpSource: String(r.rsvp_source) as Guest['rsvpSource'],
        rsvpRespondedAt: String(r.rsvp_responded_at ?? ''),
        lastInviteSentAt: String(r.last_invite_sent_at ?? ''),
        lastInviteChannel: String(r.last_invite_channel ?? '') as Guest['lastInviteChannel'],
        inviteStatus: String(r.invite_status) as Guest['inviteStatus'],
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      tables: tableRows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        capacity: Number(r.capacity),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      venueLayoutItems: venueLayoutRows.map((r) => ({
        id: String(r.id),
        type: String(r.item_type) as VenueLayoutItem['type'],
        label: String(r.label),
        x: Number(r.x),
        y: Number(r.y),
        width: Number(r.width),
        height: Number(r.height),
        rotation: Number(r.rotation),
        shape: String(r.shape) as VenueLayoutItem['shape'],
        locked: Boolean(r.locked),
        tableId: r.table_id ? String(r.table_id) : undefined,
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      budgetItems: budgetRows.map((r) => ({
        id: String(r.id),
        category: String(r.category),
        title: String(r.title),
        plannedCents: Number(r.planned_cents),
        actualCents: Number(r.actual_cents),
        paidCents: Number(r.paid_cents),
        dueDate: String(r.due_date),
        vendorId: r.vendor_id ? String(r.vendor_id) : undefined,
        notes: String(r.notes),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      vendors: vendorRows.map((r) => ({
        id: String(r.id),
        category: String(r.category),
        name: String(r.name),
        phone: String(r.phone),
        email: String(r.email),
        quoteCents: Number(r.quote_cents),
        contractStatus: String(r.contract_status) as Vendor['contractStatus'],
        paymentPlan: String(r.payment_plan),
        notes: String(r.notes),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      notes: noteRows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        content: String(r.content),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      invitationDesigns: designRows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        templateId: String(r.template_id) as InvitationDesign['templateId'],
        paletteId: String(r.palette_id),
        coupleNames: String(r.couple_names),
        weddingDate: String(r.wedding_date),
        weddingTime: String(r.wedding_time),
        venueName: String(r.venue_name),
        venueAddress: String(r.venue_address),
        message: String(r.message),
        rsvpDeadline: String(r.rsvp_deadline),
        adultsOnlyMessage: String(r.adults_only_message),
        photoUri: String(r.photo_uri),
        isDefault: Boolean(r.is_default),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
      personalInvitations: personalRows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        imageUri: String(r.image_uri),
        width: Number(r.width),
        height: Number(r.height),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
    };
  },

  async saveProfile(profile: WeddingProfile) {
    await saveProfileWithDb(await database(), profile);
  },
  async upsertTask(task: TaskItem) {
    await upsertTaskWithDb(await database(), task);
  },
  async deleteTask(id: string) {
    await (await database()).runAsync('DELETE FROM tasks WHERE id = ?', id);
  },
  async upsertGuest(guest: Guest) {
    await upsertGuestWithDb(await database(), guest);
  },
  async deleteGuest(id: string) {
    await (await database()).runAsync('DELETE FROM guests WHERE id = ?', id);
  },
  async upsertTable(table: SeatingTable) {
    await upsertTableWithDb(await database(), table);
  },
  async deleteTable(id: string) {
    await (await database()).runAsync('DELETE FROM seating_tables WHERE id = ?', id);
  },
  async upsertVenueLayoutItem(item: VenueLayoutItem) {
    await upsertVenueLayoutItemWithDb(await database(), item);
  },
  async deleteVenueLayoutItem(id: string) {
    await (await database()).runAsync('DELETE FROM venue_layout_items WHERE id = ?', id);
  },
  async upsertBudgetItem(item: BudgetItem) {
    await upsertBudgetWithDb(await database(), item);
  },
  async deleteBudgetItem(id: string) {
    await (await database()).runAsync('DELETE FROM budget_items WHERE id = ?', id);
  },
  async upsertVendor(vendor: Vendor) {
    await upsertVendorWithDb(await database(), vendor);
  },
  async deleteVendor(id: string) {
    await (await database()).runAsync('DELETE FROM vendors WHERE id = ?', id);
  },
  async upsertNote(note: NoteItem) {
    await upsertNoteWithDb(await database(), note);
  },
  async deleteNote(id: string) {
    await (await database()).runAsync('DELETE FROM notes WHERE id = ?', id);
  },

  async upsertInvitationDesign(design: InvitationDesign) {
    await upsertInvitationDesignWithDb(await database(), design);
  },
  async deleteInvitationDesign(id: string) {
    await (await database()).runAsync('DELETE FROM invitation_designs WHERE id = ?', id);
  },
  async upsertPersonalInvitation(item: PersonalInvitation) {
    await upsertPersonalInvitationWithDb(await database(), item);
  },
  async deletePersonalInvitation(id: string) {
    await (await database()).runAsync('DELETE FROM personal_invitations WHERE id = ?', id);
  },
  /** Varsayılan davetiyeyi tek kayıt olarak işaretler. */
  async setDefaultInvitationDesign(id: string) {
    await (
      await database()
    ).runAsync('UPDATE invitation_designs SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END', id);
  },

  async replaceAll(data: AppData): Promise<void> {
    const db = await database();
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        'DELETE FROM guests; DELETE FROM budget_items; DELETE FROM tasks; DELETE FROM notes; DELETE FROM venue_layout_items; DELETE FROM seating_tables; DELETE FROM vendors; DELETE FROM invitation_designs; DELETE FROM personal_invitations; DELETE FROM profile;',
      );
      await saveProfileWithDb(db, data.profile);
      for (const vendor of data.vendors) await upsertVendorWithDb(db, vendor);
      for (const table of data.tables) await upsertTableWithDb(db, table);
      for (const item of data.venueLayoutItems) await upsertVenueLayoutItemWithDb(db, item);
      for (const task of data.tasks) await upsertTaskWithDb(db, task);
      for (const guest of data.guests) await upsertGuestWithDb(db, guest);
      for (const item of data.budgetItems) await upsertBudgetWithDb(db, item);
      for (const note of data.notes) await upsertNoteWithDb(db, note);
      for (const design of data.invitationDesigns) await upsertInvitationDesignWithDb(db, design);
      for (const item of data.personalInvitations) await upsertPersonalInvitationWithDb(db, item);
    });
  },
  async clearAll(): Promise<void> {
    await this.replaceAll({ ...EMPTY_APP_DATA, profile: { ...EMPTY_PROFILE } });
  },
};
