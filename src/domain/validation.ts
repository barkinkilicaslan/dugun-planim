import type {
  PersonalInvitation,
  AppData,
  BudgetItem,
  Guest,
  InvitationDesign,
  NoteItem,
  SeatingTable,
  TaskItem,
  Vendor,
  VenueLayoutItem,
  WeddingProfile,
} from './models';
import { isValidDateString } from './calculations';
import { MAX_MONEY_CENTS } from './money';
import { isValidEmail, normalizeEmail } from './contacts';
import { INVITATION_TEMPLATE_IDS } from './invitation-templates';
import { INVITE_CHANNELS, INVITE_STATUSES, RSVP_SOURCES, RSVP_STATUSES } from './rsvp';
import { t } from '@/i18n';
import { isValidTimeString } from './wedding-date';

export class ValidationError extends Error {}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(t('validation.required', { label }));
  return trimmed;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) throw new ValidationError(t('validation.nonNegativeInteger', { label }));
  return value;
}

/** Kuruş cinsinden tutar: negatif olmayan tam sayı ve `MAX_MONEY_CENTS` sınırı (toplamlar güvenli tam sayı içinde kalır). */
function money(value: number, label: string): number {
  nonNegativeInteger(value, label);
  if (value > MAX_MONEY_CENTS) throw new ValidationError(t('validation.amountMax', { label }));
  return value;
}

function date(value: string, label: string, optional = false): string {
  if (optional && !value) return '';
  if (!isValidDateString(value)) {
    throw new ValidationError(t('validation.dateFormat', { label }));
  }
  return value;
}

function boundedRequired(value: string, label: string, max: number): string {
  return boundedText(required(value, label), label, max);
}

function boundedText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(t('validation.maxLength', { label, max }));
  return trimmed;
}

export function validateProfile(profile: WeddingProfile): WeddingProfile {
  return {
    ...profile,
    couple1Name: required(profile.couple1Name, t('validation.label.name1')),
    couple2Name: required(profile.couple2Name, t('validation.label.name2')),
    weddingDate: date(profile.weddingDate, t('validation.label.weddingDate')),
    estimatedBudgetCents: money(profile.estimatedBudgetCents, t('validation.label.budget')),
    estimatedGuestCount: nonNegativeInteger(profile.estimatedGuestCount, t('validation.label.guestCount')),
    adultsOnly: Boolean(profile.adultsOnly),
    adultsOnlyMessage: boundedText(profile.adultsOnlyMessage ?? '', t('validation.label.adultsOnlyMessage'), 400),
  };
}

export function validateTask(task: TaskItem): TaskItem {
  return {
    ...task,
    title: required(task.title, t('validation.label.taskTitle')),
    category: required(task.category, t('validation.label.category')),
    dueDate: date(task.dueDate, t('validation.label.dueDate'), true),
  };
}

export function validateGuest(guest: Guest): Guest {
  const partySize = nonNegativeInteger(guest.partySize, t('validation.label.partySize'));
  if (partySize < 1) throw new ValidationError(t('validation.partySizeMin'));
  const childCount = nonNegativeInteger(guest.childCount, t('validation.label.childCount'));
  if (childCount > partySize) throw new ValidationError(t('validation.childrenExceed'));
  if (!RSVP_STATUSES.includes(guest.rsvp)) throw new ValidationError(t('validation.rsvpInvalid'));
  if (!RSVP_SOURCES.includes(guest.rsvpSource)) throw new ValidationError(t('validation.rsvpSourceInvalid'));
  if (!INVITE_STATUSES.includes(guest.inviteStatus)) throw new ValidationError(t('validation.inviteStatusInvalid'));
  if (guest.lastInviteChannel !== '' && !INVITE_CHANNELS.includes(guest.lastInviteChannel))
    throw new ValidationError(t('validation.inviteChannelInvalid'));
  const email = guest.email.trim();
  if (email && !isValidEmail(email)) throw new ValidationError(t('validation.emailInvalid'));
  return {
    ...guest,
    name: required(guest.name, t('validation.label.guestName')),
    phone: guest.phone.trim(),
    email: email ? normalizeEmail(email) : '',
    partySize,
    childCount,
  };
}

export function validateInvitationDesign(design: InvitationDesign): InvitationDesign {
  if (!INVITATION_TEMPLATE_IDS.includes(design.templateId)) throw new ValidationError(t('validation.templateInvalid'));
  if (!design.paletteId) throw new ValidationError(t('validation.paletteInvalid'));
  if (design.weddingDate && !isValidDateString(design.weddingDate))
    throw new ValidationError(t('validation.designDateInvalid'));
  if (design.rsvpDeadline && !isValidDateString(design.rsvpDeadline))
    throw new ValidationError(t('validation.deadlineInvalid'));
  if (design.weddingTime && !isValidTimeString(design.weddingTime))
    throw new ValidationError(t('validation.timeInvalid'));
  return {
    ...design,
    name: required(design.name, t('validation.label.designName')),
    coupleNames: boundedText(design.coupleNames, t('validation.label.coupleNames'), 80),
    venueName: boundedText(design.venueName, t('validation.label.venueName'), 120),
    venueAddress: boundedText(design.venueAddress, t('validation.label.venueAddress'), 240),
    message: boundedText(design.message, t('validation.label.inviteMessage'), 600),
    adultsOnlyMessage: boundedText(design.adultsOnlyMessage, t('validation.label.adultsOnlyMessage'), 400),
  };
}

export function validateTable(table: SeatingTable): SeatingTable {
  const capacity = nonNegativeInteger(table.capacity, t('validation.label.capacity'));
  if (capacity < 1) throw new ValidationError(t('validation.tableCapacityMin'));
  return { ...table, name: required(table.name, t('validation.label.tableName')), capacity };
}

export function validateVenueLayoutItem(item: VenueLayoutItem): VenueLayoutItem {
  const allowedTypes = ['table', 'stage', 'danceFloor', 'entrance', 'dj', 'service'];
  if (!allowedTypes.includes(item.type)) throw new ValidationError(t('validation.layoutTypeInvalid'));
  if (item.shape !== 'round' && item.shape !== 'rectangle')
    throw new ValidationError(t('validation.layoutShapeInvalid'));
  const values = [item.x, item.y, item.width, item.height, item.rotation];
  if (values.some((value) => !Number.isFinite(value))) throw new ValidationError(t('validation.layoutSizeInvalid'));
  if (
    item.x < 0 ||
    item.y < 0 ||
    item.width < 0.1 ||
    item.height < 0.1 ||
    item.x + item.width > 1.0001 ||
    item.y + item.height > 1.0001
  ) {
    throw new ValidationError(t('validation.layoutOutside'));
  }
  if (item.type === 'table' && !item.tableId) throw new ValidationError(t('validation.layoutTableLink'));
  if (item.type !== 'table' && item.tableId) throw new ValidationError(t('validation.layoutOnlyTables'));
  return {
    ...item,
    label: required(item.label, t('validation.label.layoutLabel')),
    rotation: Math.round(item.rotation),
  };
}

export function validateBudgetItem(item: BudgetItem): BudgetItem {
  const values = [item.plannedCents, item.actualCents, item.paidCents];
  values.forEach((value, index) =>
    money(value, [t('validation.label.planned'), t('validation.label.actual'), t('validation.label.paid')][index]),
  );
  if (item.paidCents > item.actualCents) throw new ValidationError(t('validation.paidExceeds'));
  return {
    ...item,
    title: required(item.title, t('validation.label.expenseName')),
    category: required(item.category, t('validation.label.category')),
    dueDate: date(item.dueDate, t('validation.label.dueShort'), true),
  };
}

export function validateVendor(vendor: Vendor): Vendor {
  return {
    ...vendor,
    name: required(vendor.name, t('validation.label.vendorName')),
    category: required(vendor.category, t('validation.label.category')),
    quoteCents: money(vendor.quoteCents, t('validation.label.quote')),
  };
}

export function validatePersonalInvitation(item: PersonalInvitation): PersonalInvitation {
  if (!item.imageUri)
    throw new ValidationError(t('validation.required', { label: t('validation.label.personalImage') }));
  return {
    ...item,
    name: boundedRequired(item.name, t('validation.label.personalName'), 60),
    width: nonNegativeInteger(Math.round(item.width), t('validation.label.personalImage')),
    height: nonNegativeInteger(Math.round(item.height), t('validation.label.personalImage')),
  };
}

export function validateNote(note: NoteItem): NoteItem {
  return {
    ...note,
    title: required(note.title, t('validation.label.noteTitle')),
    content: required(note.content, t('validation.label.noteContent')),
  };
}

/** Şema 1-2 yedeklerinde bulunmayan misafir alanlarını güvenli varsayılanlarla tamamlar. */
function withGuestDefaults(guest: Guest): Guest {
  const legacy: Partial<Guest> = guest;
  return {
    ...guest,
    email: legacy.email ?? '',
    rsvpSource: legacy.rsvpSource ?? (guest.rsvp === 'pending' ? 'none' : 'manual'),
    rsvpRespondedAt: legacy.rsvpRespondedAt ?? '',
    lastInviteSentAt: legacy.lastInviteSentAt ?? '',
    lastInviteChannel: legacy.lastInviteChannel ?? '',
    inviteStatus: legacy.inviteStatus ?? 'none',
  };
}

function withProfileDefaults(profile: WeddingProfile): WeddingProfile {
  const legacy: Partial<WeddingProfile> = profile;
  return { ...profile, adultsOnly: legacy.adultsOnly ?? false, adultsOnlyMessage: legacy.adultsOnlyMessage ?? '' };
}

export function validateAppData(data: AppData): AppData {
  if (!data || typeof data !== 'object') throw new ValidationError(t('validation.backupMissing'));
  if (
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.guests) ||
    !Array.isArray(data.tables) ||
    !Array.isArray(data.budgetItems) ||
    !Array.isArray(data.vendors) ||
    !Array.isArray(data.notes)
  ) {
    throw new ValidationError(t('validation.backupListsBroken'));
  }
  const tables = data.tables.map(validateTable);
  const tableIds = new Set(tables.map((table) => table.id));
  const venueLayoutItems = (Array.isArray(data.venueLayoutItems) ? data.venueLayoutItems : []).map(
    validateVenueLayoutItem,
  );
  const linkedTableIds = new Set<string>();
  for (const item of venueLayoutItems) {
    if (!item.tableId) continue;
    if (!tableIds.has(item.tableId)) throw new ValidationError(t('validation.layoutTableMissing'));
    if (linkedTableIds.has(item.tableId)) throw new ValidationError(t('validation.layoutTableTwice'));
    linkedTableIds.add(item.tableId);
  }
  const designs = (Array.isArray(data.invitationDesigns) ? data.invitationDesigns : []).map((design) =>
    validateInvitationDesign({ ...design, photoUri: '' }),
  );
  if (designs.filter((design) => design.isDefault).length > 1)
    throw new ValidationError(t('validation.oneDefaultInvitation'));
  return {
    profile: data.profile.onboardingCompleted
      ? validateProfile(withProfileDefaults(data.profile))
      : withProfileDefaults(data.profile),
    tasks: data.tasks.map(validateTask),
    guests: data.guests.map((guest) => validateGuest(withGuestDefaults(guest))),
    tables,
    venueLayoutItems,
    budgetItems: data.budgetItems.map(validateBudgetItem),
    vendors: data.vendors.map(validateVendor),
    notes: data.notes.map(validateNote),
    invitationDesigns: designs,
    // Kişisel davetiye görselleri yedekten gelmez; mevcut cihaz kayıtları uygulama bağlamında korunur.
    personalInvitations: [],
  };
}
