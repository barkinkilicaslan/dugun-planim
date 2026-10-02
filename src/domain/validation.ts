import type {
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
import { isValidEmail, normalizeEmail } from './contacts';
import { INVITATION_TEMPLATE_IDS } from './invitation-templates';
import { INVITE_CHANNELS, INVITE_STATUSES, RSVP_SOURCES, RSVP_STATUSES } from './rsvp';
import { isValidTimeString } from './wedding-date';

export class ValidationError extends Error {}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ValidationError(`${label} zorunludur.`);
  return trimmed;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) throw new ValidationError(`${label} negatif olmayan tam sayı olmalıdır.`);
  return value;
}

function date(value: string, label: string, optional = false): string {
  if (optional && !value) return '';
  if (!isValidDateString(value)) {
    throw new ValidationError(`${label} YYYY-AA-GG biçiminde geçerli olmalıdır.`);
  }
  return value;
}

function boundedText(value: string, label: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${label} en fazla ${max} karakter olabilir.`);
  return trimmed;
}

export function validateProfile(profile: WeddingProfile): WeddingProfile {
  return {
    ...profile,
    couple1Name: required(profile.couple1Name, 'Birinci isim'),
    couple2Name: required(profile.couple2Name, 'İkinci isim'),
    weddingDate: date(profile.weddingDate, 'Düğün tarihi'),
    estimatedBudgetCents: nonNegativeInteger(profile.estimatedBudgetCents, 'Bütçe'),
    estimatedGuestCount: nonNegativeInteger(profile.estimatedGuestCount, 'Davetli sayısı'),
    adultsOnly: Boolean(profile.adultsOnly),
    adultsOnlyMessage: boundedText(profile.adultsOnlyMessage ?? '', 'Çocuksuz düğün mesajı', 400),
  };
}

export function validateTask(task: TaskItem): TaskItem {
  return {
    ...task,
    title: required(task.title, 'Görev başlığı'),
    category: required(task.category, 'Kategori'),
    dueDate: date(task.dueDate, 'Son tarih', true),
  };
}

export function validateGuest(guest: Guest): Guest {
  const partySize = nonNegativeInteger(guest.partySize, 'Kişi sayısı');
  if (partySize < 1) throw new ValidationError('Kişi sayısı en az 1 olmalıdır.');
  const childCount = nonNegativeInteger(guest.childCount, 'Çocuk sayısı');
  if (childCount > partySize) throw new ValidationError('Çocuk sayısı toplam kişi sayısını aşamaz.');
  if (!RSVP_STATUSES.includes(guest.rsvp)) throw new ValidationError('Davet durumu geçersiz.');
  if (!RSVP_SOURCES.includes(guest.rsvpSource)) throw new ValidationError('Yanıt kaynağı geçersiz.');
  if (!INVITE_STATUSES.includes(guest.inviteStatus)) throw new ValidationError('Davetiye gönderim durumu geçersiz.');
  if (guest.lastInviteChannel !== '' && !INVITE_CHANNELS.includes(guest.lastInviteChannel))
    throw new ValidationError('Davetiye gönderim kanalı geçersiz.');
  const email = guest.email.trim();
  if (email && !isValidEmail(email)) throw new ValidationError('E-posta adresi geçerli değil.');
  return {
    ...guest,
    name: required(guest.name, 'Davetli adı'),
    phone: guest.phone.trim(),
    email: email ? normalizeEmail(email) : '',
    partySize,
    childCount,
  };
}

export function validateInvitationDesign(design: InvitationDesign): InvitationDesign {
  if (!INVITATION_TEMPLATE_IDS.includes(design.templateId)) throw new ValidationError('Davetiye şablonu geçersiz.');
  if (!design.paletteId) throw new ValidationError('Davetiye renk paleti geçersiz.');
  if (design.weddingDate && !isValidDateString(design.weddingDate))
    throw new ValidationError('Davetiye tarihi geçerli bir takvim tarihi olmalıdır.');
  if (design.rsvpDeadline && !isValidDateString(design.rsvpDeadline))
    throw new ValidationError('Son cevap tarihi geçerli bir takvim tarihi olmalıdır.');
  if (design.weddingTime && !isValidTimeString(design.weddingTime))
    throw new ValidationError('Düğün saati SS:DD biçiminde olmalıdır.');
  return {
    ...design,
    name: required(design.name, 'Tasarım adı'),
    coupleNames: boundedText(design.coupleNames, 'Çift isimleri', 80),
    venueName: boundedText(design.venueName, 'Mekân adı', 120),
    venueAddress: boundedText(design.venueAddress, 'Mekân adresi', 240),
    message: boundedText(design.message, 'Davet metni', 600),
    adultsOnlyMessage: boundedText(design.adultsOnlyMessage, 'Çocuksuz düğün mesajı', 400),
  };
}

export function validateTable(table: SeatingTable): SeatingTable {
  const capacity = nonNegativeInteger(table.capacity, 'Kapasite');
  if (capacity < 1) throw new ValidationError('Masa kapasitesi en az 1 olmalıdır.');
  return { ...table, name: required(table.name, 'Masa adı'), capacity };
}

export function validateVenueLayoutItem(item: VenueLayoutItem): VenueLayoutItem {
  const allowedTypes = ['table', 'stage', 'danceFloor', 'entrance', 'dj', 'service'];
  if (!allowedTypes.includes(item.type)) throw new ValidationError('Salon planı öğe türü geçersiz.');
  if (item.shape !== 'round' && item.shape !== 'rectangle') throw new ValidationError('Salon planı şekli geçersiz.');
  const values = [item.x, item.y, item.width, item.height, item.rotation];
  if (values.some((value) => !Number.isFinite(value))) throw new ValidationError('Salon planı ölçüleri geçersiz.');
  if (
    item.x < 0 ||
    item.y < 0 ||
    item.width < 0.1 ||
    item.height < 0.1 ||
    item.x + item.width > 1.0001 ||
    item.y + item.height > 1.0001
  ) {
    throw new ValidationError('Salon planı öğesi çizim alanının dışında.');
  }
  if (item.type === 'table' && !item.tableId)
    throw new ValidationError('Salon planındaki masa bir masa kaydına bağlı olmalıdır.');
  if (item.type !== 'table' && item.tableId)
    throw new ValidationError('Yalnız masa öğeleri masa kaydına bağlanabilir.');
  return { ...item, label: required(item.label, 'Salon planı etiketi'), rotation: Math.round(item.rotation) };
}

export function validateBudgetItem(item: BudgetItem): BudgetItem {
  const values = [item.plannedCents, item.actualCents, item.paidCents];
  values.forEach((value, index) => nonNegativeInteger(value, ['Planlanan', 'Gerçekleşen', 'Ödenen'][index]));
  if (item.paidCents > item.actualCents) throw new ValidationError('Ödenen tutar gerçekleşen tutarı aşamaz.');
  return {
    ...item,
    title: required(item.title, 'Harcama adı'),
    category: required(item.category, 'Kategori'),
    dueDate: date(item.dueDate, 'Vade', true),
  };
}

export function validateVendor(vendor: Vendor): Vendor {
  return {
    ...vendor,
    name: required(vendor.name, 'Tedarikçi adı'),
    category: required(vendor.category, 'Kategori'),
    quoteCents: nonNegativeInteger(vendor.quoteCents, 'Teklif'),
  };
}

export function validateNote(note: NoteItem): NoteItem {
  return { ...note, title: required(note.title, 'Not başlığı'), content: required(note.content, 'Not içeriği') };
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
  if (!data || typeof data !== 'object') throw new ValidationError('Yedek verisi bulunamadı.');
  if (
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.guests) ||
    !Array.isArray(data.tables) ||
    !Array.isArray(data.budgetItems) ||
    !Array.isArray(data.vendors) ||
    !Array.isArray(data.notes)
  ) {
    throw new ValidationError('Yedek veri listeleri eksik veya bozuk.');
  }
  const tables = data.tables.map(validateTable);
  const tableIds = new Set(tables.map((table) => table.id));
  const venueLayoutItems = (Array.isArray(data.venueLayoutItems) ? data.venueLayoutItems : []).map(
    validateVenueLayoutItem,
  );
  const linkedTableIds = new Set<string>();
  for (const item of venueLayoutItems) {
    if (!item.tableId) continue;
    if (!tableIds.has(item.tableId)) throw new ValidationError('Salon planındaki masa kaydı bulunamadı.');
    if (linkedTableIds.has(item.tableId))
      throw new ValidationError('Bir masa salon planına yalnız bir kez eklenebilir.');
    linkedTableIds.add(item.tableId);
  }
  const designs = (Array.isArray(data.invitationDesigns) ? data.invitationDesigns : []).map((design) =>
    validateInvitationDesign({ ...design, photoUri: '' }),
  );
  if (designs.filter((design) => design.isDefault).length > 1)
    throw new ValidationError('Yalnız bir davetiye varsayılan olabilir.');
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
  };
}
