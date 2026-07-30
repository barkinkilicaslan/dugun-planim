export type CurrencyCode = 'TRY' | 'EUR' | 'USD' | 'GBP';
export type ThemePreference = 'light' | 'dark' | 'system';
export type DateFormatPreference = 'DD.MM.YYYY' | 'YYYY-MM-DD';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RsvpStatus = 'pending' | 'attending' | 'declined';
export type GuestSide = 'couple1' | 'couple2' | 'common';
export type GuestGroup = 'family' | 'friends' | 'work' | 'other';
export type ContractStatus = 'researching' | 'quoted' | 'signed' | 'completed';

export interface WeddingProfile {
  couple1Name: string;
  couple2Name: string;
  weddingDate: string;
  estimatedBudgetCents: number;
  estimatedGuestCount: number;
  currency: CurrencyCode;
  theme: ThemePreference;
  dateFormat: DateFormatPreference;
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface TaskItem {
  id: string;
  category: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  side: GuestSide;
  partySize: number;
  childCount: number;
  rsvp: RsvpStatus;
  notes: string;
  mealNotes: string;
  group: GuestGroup;
  tableId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  title: string;
  plannedCents: number;
  actualCents: number;
  paidCents: number;
  dueDate: string;
  vendorId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  category: string;
  name: string;
  phone: string;
  email: string;
  quoteCents: number;
  contractStatus: ContractStatus;
  paymentPlan: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  profile: WeddingProfile;
  tasks: TaskItem[];
  guests: Guest[];
  tables: SeatingTable[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  notes: NoteItem[];
}

export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = 1;

export const EMPTY_PROFILE: WeddingProfile = {
  couple1Name: '',
  couple2Name: '',
  weddingDate: '',
  estimatedBudgetCents: 0,
  estimatedGuestCount: 0,
  currency: 'TRY',
  theme: 'system',
  dateFormat: 'DD.MM.YYYY',
  notificationsEnabled: false,
  onboardingCompleted: false,
};

export const EMPTY_APP_DATA: AppData = {
  profile: EMPTY_PROFILE,
  tasks: [],
  guests: [],
  tables: [],
  budgetItems: [],
  vendors: [],
  notes: [],
};
