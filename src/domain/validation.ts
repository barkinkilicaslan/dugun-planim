import type { AppData, BudgetItem, Guest, NoteItem, SeatingTable, TaskItem, Vendor, WeddingProfile } from './models';
import { isValidDateString } from './calculations';

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

export function validateProfile(profile: WeddingProfile): WeddingProfile {
  return {
    ...profile,
    couple1Name: required(profile.couple1Name, 'Birinci isim'),
    couple2Name: required(profile.couple2Name, 'İkinci isim'),
    weddingDate: date(profile.weddingDate, 'Düğün tarihi'),
    estimatedBudgetCents: nonNegativeInteger(profile.estimatedBudgetCents, 'Bütçe'),
    estimatedGuestCount: nonNegativeInteger(profile.estimatedGuestCount, 'Davetli sayısı'),
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
  return { ...guest, name: required(guest.name, 'Davetli adı'), partySize, childCount };
}

export function validateTable(table: SeatingTable): SeatingTable {
  const capacity = nonNegativeInteger(table.capacity, 'Kapasite');
  if (capacity < 1) throw new ValidationError('Masa kapasitesi en az 1 olmalıdır.');
  return { ...table, name: required(table.name, 'Masa adı'), capacity };
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
  return {
    profile: data.profile.onboardingCompleted ? validateProfile(data.profile) : data.profile,
    tasks: data.tasks.map(validateTask),
    guests: data.guests.map(validateGuest),
    tables: data.tables.map(validateTable),
    budgetItems: data.budgetItems.map(validateBudgetItem),
    vendors: data.vendors.map(validateVendor),
    notes: data.notes.map(validateNote),
  };
}
