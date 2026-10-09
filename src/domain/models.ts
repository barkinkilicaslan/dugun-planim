export type CurrencyCode = 'TRY' | 'EUR' | 'USD' | 'GBP';
export type ThemePreference = 'light' | 'dark' | 'system';
export type DateFormatPreference = 'DD.MM.YYYY' | 'YYYY-MM-DD';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RsvpStatus = 'pending' | 'attending' | 'declined' | 'maybe';
/** Yanıtın nereden geldiği: hiç yanıt yok, kullanıcı elle girdi veya çevrimiçi yanıttan geldi. */
export type RsvpSource = 'none' | 'manual' | 'online';
export type InviteChannel = 'email' | 'sms' | 'whatsapp' | 'share';
/** İşletim sistemi gönderimi doğrulamadığı için yalnız "ekran açıldı" veya kullanıcı işaretli "gönderildi" tutulur. */
export type InviteDispatchStatus = 'none' | 'opened' | 'markedSent';
export type GuestSide = 'couple1' | 'couple2' | 'common';
export type GuestGroup = 'family' | 'friends' | 'work' | 'other';
export type ContractStatus = 'researching' | 'quoted' | 'signed' | 'completed';
export type VenueLayoutItemType = 'table' | 'stage' | 'danceFloor' | 'entrance' | 'dj' | 'service';
export type VenueLayoutItemShape = 'round' | 'rectangle';

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
  adultsOnly: boolean;
  adultsOnlyMessage: string;
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
  suggestionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  side: GuestSide;
  partySize: number;
  childCount: number;
  rsvp: RsvpStatus;
  notes: string;
  mealNotes: string;
  group: GuestGroup;
  tableId?: string;
  rsvpSource: RsvpSource;
  /** Yanıt tarihi (ISO zaman damgası) veya boş metin. */
  rsvpRespondedAt: string;
  lastInviteSentAt: string;
  lastInviteChannel: InviteChannel | '';
  inviteStatus: InviteDispatchStatus;
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

export interface VenueLayoutItem {
  id: string;
  type: VenueLayoutItemType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: VenueLayoutItemShape;
  locked: boolean;
  tableId?: string;
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

export type InvitationTemplateId =
  | 'classic'
  | 'minimal'
  | 'botanical'
  | 'modern'
  | 'boho'
  | 'goldElegance'
  | 'garden'
  | 'geometric'
  | 'night'
  | 'romantic';

export interface InvitationDesign {
  id: string;
  name: string;
  templateId: InvitationTemplateId;
  paletteId: string;
  /** Boşsa düğün profilindeki değer kullanılır. */
  coupleNames: string;
  weddingDate: string;
  weddingTime: string;
  venueName: string;
  venueAddress: string;
  message: string;
  rsvpDeadline: string;
  adultsOnlyMessage: string;
  /** Cihaz içi kalıcı kopya; yedek dosyasına dahil edilmez. */
  photoUri: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Kullanıcının kendi hazırladığı davetiye görseli (JPG/PNG). Dosya yalnız cihazdaki uygulama klasöründe tutulur;
 * sunucuya gönderilmez ve JSON yedeğe dahil edilmez.
 */
export interface PersonalInvitation {
  id: string;
  name: string;
  /** Uygulama klasöründeki kalıcı kopya (file://). */
  imageUri: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  profile: WeddingProfile;
  tasks: TaskItem[];
  guests: Guest[];
  tables: SeatingTable[];
  venueLayoutItems: VenueLayoutItem[];
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  notes: NoteItem[];
  invitationDesigns: InvitationDesign[];
  /** Yedek dosyasına girmez; geri yüklemede cihazdakiler korunur. */
  personalInvitations: PersonalInvitation[];
}

export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = 4;

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
  adultsOnly: false,
  adultsOnlyMessage: '',
};

export const EMPTY_APP_DATA: AppData = {
  profile: EMPTY_PROFILE,
  tasks: [],
  guests: [],
  tables: [],
  venueLayoutItems: [],
  budgetItems: [],
  vendors: [],
  notes: [],
  invitationDesigns: [],
  personalInvitations: [],
};
