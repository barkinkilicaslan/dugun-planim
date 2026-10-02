import { getLocales } from 'expo-localization';

const tr = {
  'tabs.home': 'Ana Sayfa',
  'tabs.tasks': 'Görevler',
  'tabs.guests': 'Davetliler',
  'tabs.budget': 'Bütçe',
  'tabs.more': 'Diğer',
  'nav.back': 'Geri',
  'nav.task': 'Görev',
  'nav.guest': 'Davetli',
  'nav.budgetItem': 'Bütçe kalemi',
  'nav.vendor': 'Tedarikçi',
  'nav.note': 'Not',
  'nav.tables': 'Masa planı',
  'nav.vendors': 'Tedarikçiler',
  'nav.calendar': 'Takvim',
  'nav.notes': 'Notlar',
  'nav.settings': 'Ayarlar',
  'nav.legal': 'Bilgilendirme',
  'nav.contactsImport': 'Rehberden davetli ekle',
  'nav.invitations': 'Davetiyeler',
  'nav.invitationEditor': 'Davetiye tasarımı',
  'nav.inviteSend': 'Davetiye gönder',
} as const;

export type MessageKey = keyof typeof tr;

const en: Record<MessageKey, string> = {
  'tabs.home': 'Home',
  'tabs.tasks': 'Tasks',
  'tabs.guests': 'Guests',
  'tabs.budget': 'Budget',
  'tabs.more': 'More',
  'nav.back': 'Back',
  'nav.task': 'Task',
  'nav.guest': 'Guest',
  'nav.budgetItem': 'Budget item',
  'nav.vendor': 'Vendor',
  'nav.note': 'Note',
  'nav.tables': 'Seating plan',
  'nav.vendors': 'Vendors',
  'nav.calendar': 'Calendar',
  'nav.notes': 'Notes',
  'nav.settings': 'Settings',
  'nav.legal': 'Information',
  'nav.contactsImport': 'Add guests from contacts',
  'nav.invitations': 'Invitations',
  'nav.invitationEditor': 'Invitation design',
  'nav.inviteSend': 'Send invitation',
};

const dictionaries = { tr, en } as const;
export type SupportedLocale = keyof typeof dictionaries;

export function resolveLocale(languageCode = getLocales()[0]?.languageCode): SupportedLocale {
  return languageCode === 'en' ? 'en' : 'tr';
}

export function t(key: MessageKey, locale = resolveLocale()): string {
  return dictionaries[locale][key];
}
