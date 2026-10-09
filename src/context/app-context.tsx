import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import * as Crypto from 'expo-crypto';

import { repository } from '@/data/repository';
import { t } from '@/i18n';
import {
  EMPTY_APP_DATA,
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
import {
  validateAppData,
  validateBudgetItem,
  validateGuest,
  validateInvitationDesign,
  validateNote,
  validatePersonalInvitation,
  validateProfile,
  validateTable,
  validateTask,
  validateVendor,
  validateVenueLayoutItem,
} from '@/domain/validation';
import type { ClearAllResult, DeleteLeftover, RestoreResult } from '@/domain/data-lifecycle';
import { removeAllExportFiles } from '@/services/export-files';
import { removeInvitationTempFiles } from '@/services/invitation-files';
import {
  cancelAllScheduledReminders,
  cancelOrphanedReminders,
  cancelTaskReminder,
  clearAllNotifications,
  getNotificationPermission,
  requestNotificationConsent,
  resetNotificationConsent,
  scheduleTaskReminder,
} from '@/services/notifications';
import {
  removeAllInvitationPhotos,
  removeInvitationPhoto,
  removeUnreferencedInvitationPhotos,
} from '@/services/invitation-photos';
import {
  removeAllPersonalInvitationFiles,
  removePersonalInvitationFile,
  removeUnreferencedPersonalInvitationFiles,
} from '@/services/personal-invitations';

type EntityKey =
  | 'tasks'
  | 'guests'
  | 'tables'
  | 'venueLayoutItems'
  | 'budgetItems'
  | 'vendors'
  | 'notes'
  | 'invitationDesigns'
  | 'personalInvitations';

interface AppContextValue {
  data: AppData;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  completeOnboarding: (profile: WeddingProfile, askNotifications: boolean) => Promise<void>;
  saveProfile: (profile: WeddingProfile) => Promise<void>;
  saveTask: (task: TaskItem, reminder?: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveGuest: (guest: Guest) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  saveTable: (table: SeatingTable) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  saveVenueLayoutItem: (item: VenueLayoutItem) => Promise<void>;
  deleteVenueLayoutItem: (id: string) => Promise<void>;
  saveBudgetItem: (item: BudgetItem) => Promise<void>;
  deleteBudgetItem: (id: string) => Promise<void>;
  saveVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  saveNote: (note: NoteItem) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveInvitationDesign: (design: InvitationDesign) => Promise<void>;
  deleteInvitationDesign: (id: string) => Promise<void>;
  setDefaultInvitationDesign: (id: string) => Promise<void>;
  savePersonalInvitation: (item: PersonalInvitation) => Promise<void>;
  deletePersonalInvitation: (id: string) => Promise<void>;
  replaceAll: (next: AppData) => Promise<RestoreResult>;
  clearAll: () => Promise<ClearAllResult>;
  createId: () => string;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<AppData>({ ...EMPTY_APP_DATA, profile: { ...EMPTY_APP_DATA.profile } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const createId = useCallback(() => Crypto.randomUUID(), []);
  const refresh = useCallback(async () => {
    try {
      setError(undefined);
      await repository.initialize();
      setData(await repository.load());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('app.loadDataFailed'));
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await repository.initialize();
        const loaded = await repository.load();
        if (active) setData(loaded);
        try {
          await removeUnreferencedInvitationPhotos(loaded.invitationDesigns.map((design) => design.photoUri));
          await removeUnreferencedPersonalInvitationFiles(loaded.personalInvitations.map((item) => item.imageUri));
        } catch {
          // Dosya temizliği başarısız olursa açılış etkilenmez; bir sonraki açılışta yeniden denenir.
        }
        // İlk kuruluma dönmüş (veya hiç kurulmamış) bir uygulamada eski bir bildirim izin kararı kalmasın.
        if (!loaded.profile.onboardingCompleted) {
          try {
            await resetNotificationConsent();
          } catch {
            // Anahtar silinemezse açılış etkilenmez; bir sonraki açılışta yeniden denenir.
          }
        }
        // Hiçbir göreve ait olmayan eski hatırlatmalar (geri yükleme veya yarım kalmış silme kalıntısı) iptal edilir.
        try {
          await cancelOrphanedReminders(
            new Set(loaded.tasks.map((task) => task.notificationId).filter((id): id is string => Boolean(id))),
          );
        } catch {
          // Bildirim servisi yanıt vermezse açılış etkilenmez; bir sonraki açılışta yeniden denenir.
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : t('app.startFailed'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateEntity = useCallback(<T extends { id: string }>(key: EntityKey, item: T) => {
    setData((current) => ({
      ...current,
      [key]: [...(current[key] as unknown as T[]).filter((entry) => entry.id !== item.id), item],
    }));
  }, []);
  const removeEntity = useCallback(
    (key: EntityKey, id: string) =>
      setData((current) => ({
        ...current,
        [key]: (current[key] as { id: string }[]).filter((item) => item.id !== id),
      })),
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      loading,
      error,
      refresh,
      createId,
      completeOnboarding: async (profile, askNotifications) => {
        const notificationsEnabled = askNotifications ? await requestNotificationConsent() : false;
        const nextProfile = validateProfile({ ...profile, notificationsEnabled, onboardingCompleted: true });
        const next = {
          ...EMPTY_APP_DATA,
          profile: nextProfile,
          tasks: [],
        };
        await repository.replaceAll(next);
        setData(next);
      },
      saveProfile: async (profile) => {
        const valid = validateProfile(profile);
        await repository.saveProfile(valid);
        setData((current) => ({ ...current, profile: valid }));
      },
      saveTask: async (task, reminder = false) => {
        let valid = validateTask(task);
        if (valid.notificationId) await cancelTaskReminder(valid.notificationId);
        valid = {
          ...valid,
          notificationId: reminder && data.profile.notificationsEnabled ? await scheduleTaskReminder(valid) : undefined,
        };
        await repository.upsertTask(valid);
        updateEntity('tasks', valid);
      },
      deleteTask: async (id) => {
        const task = data.tasks.find((item) => item.id === id);
        await cancelTaskReminder(task?.notificationId);
        await repository.deleteTask(id);
        removeEntity('tasks', id);
      },
      saveGuest: async (guest) => {
        const valid = validateGuest(guest);
        await repository.upsertGuest(valid);
        updateEntity('guests', valid);
      },
      deleteGuest: async (id) => {
        await repository.deleteGuest(id);
        removeEntity('guests', id);
      },
      saveTable: async (table) => {
        const valid = validateTable(table);
        await repository.upsertTable(valid);
        updateEntity('tables', valid);
      },
      deleteTable: async (id) => {
        await repository.deleteTable(id);
        setData((current) => ({
          ...current,
          tables: current.tables.filter((table) => table.id !== id),
          guests: current.guests.map((guest) => (guest.tableId === id ? { ...guest, tableId: undefined } : guest)),
          venueLayoutItems: current.venueLayoutItems.filter((item) => item.tableId !== id),
        }));
      },
      saveVenueLayoutItem: async (item) => {
        const valid = validateVenueLayoutItem(item);
        await repository.upsertVenueLayoutItem(valid);
        updateEntity('venueLayoutItems', valid);
      },
      deleteVenueLayoutItem: async (id) => {
        await repository.deleteVenueLayoutItem(id);
        removeEntity('venueLayoutItems', id);
      },
      saveBudgetItem: async (item) => {
        const valid = validateBudgetItem(item);
        await repository.upsertBudgetItem(valid);
        updateEntity('budgetItems', valid);
      },
      deleteBudgetItem: async (id) => {
        await repository.deleteBudgetItem(id);
        removeEntity('budgetItems', id);
      },
      saveVendor: async (vendor) => {
        const valid = validateVendor(vendor);
        await repository.upsertVendor(valid);
        updateEntity('vendors', valid);
      },
      deleteVendor: async (id) => {
        await repository.deleteVendor(id);
        removeEntity('vendors', id);
        setData((current) => ({
          ...current,
          budgetItems: current.budgetItems.map((item) =>
            item.vendorId === id ? { ...item, vendorId: undefined } : item,
          ),
        }));
      },
      saveNote: async (note) => {
        const valid = validateNote(note);
        await repository.upsertNote(valid);
        updateEntity('notes', valid);
      },
      deleteNote: async (id) => {
        await repository.deleteNote(id);
        removeEntity('notes', id);
      },
      saveInvitationDesign: async (design) => {
        const valid = validateInvitationDesign(design);
        const previousPhoto = data.invitationDesigns.find((item) => item.id === valid.id)?.photoUri;
        await repository.upsertInvitationDesign(valid);
        updateEntity('invitationDesigns', valid);
        // Önceki fotoğraf yalnız kayıt başarıyla bittikten sonra silinir; kayıt hata verirse eski dosya korunur.
        if (previousPhoto && previousPhoto !== valid.photoUri) await removeInvitationPhoto(previousPhoto);
        if (valid.isDefault) {
          await repository.setDefaultInvitationDesign(valid.id);
          setData((current) => ({
            ...current,
            invitationDesigns: current.invitationDesigns.map((item) => ({ ...item, isDefault: item.id === valid.id })),
          }));
        }
      },
      deleteInvitationDesign: async (id) => {
        const removed = data.invitationDesigns.find((item) => item.id === id);
        await repository.deleteInvitationDesign(id);
        await removeInvitationPhoto(removed?.photoUri);
        removeEntity('invitationDesigns', id);
      },
      setDefaultInvitationDesign: async (id) => {
        await repository.setDefaultInvitationDesign(id);
        setData((current) => ({
          ...current,
          invitationDesigns: current.invitationDesigns.map((item) => ({ ...item, isDefault: item.id === id })),
        }));
      },
      savePersonalInvitation: async (item) => {
        const valid = validatePersonalInvitation(item);
        const previous = data.personalInvitations.find((entry) => entry.id === valid.id)?.imageUri;
        await repository.upsertPersonalInvitation(valid);
        updateEntity('personalInvitations', valid);
        // Önceki görsel yalnız kayıt başarıyla bittikten sonra silinir; kayıt hata verirse eski dosya korunur.
        if (previous && previous !== valid.imageUri) await removePersonalInvitationFile(previous);
      },
      deletePersonalInvitation: async (id) => {
        const removed = data.personalInvitations.find((entry) => entry.id === id);
        await repository.deletePersonalInvitation(id);
        await removePersonalInvitationFile(removed?.imageUri);
        removeEntity('personalInvitations', id);
      },
      replaceAll: async (next) => {
        // Kendi davetiye görselleri yedekte yoktur; geri yüklemede bu cihazdaki kayıtlar ve dosyalar korunur.
        const validated = { ...validateAppData(next), personalInvitations: data.personalInvitations };
        // Yedekteki bildirim kimlikleri başka bir cihaza/oturuma aittir ve bu cihazda geçersizdir. Yedekteki
        // `notificationsEnabled` değeri de bu cihazın izni sayılmaz: yalnız işletim sistemi izni VARSA açık kalır.
        // İzin durumu yalnız okunur; izin penceresi açılmaz.
        const permission = await getNotificationPermission();
        const backupEnabled = validated.profile.notificationsEnabled;
        const enabled = backupEnabled && permission === 'granted';
        const reminderTasks = validated.tasks.filter((task) => task.notificationId && !task.completed && task.dueDate);
        const valid = {
          ...validated,
          profile: { ...validated.profile, notificationsEnabled: enabled },
          tasks: validated.tasks.map((task) => (task.notificationId ? { ...task, notificationId: undefined } : task)),
        };
        // Önce veritabanı: başarısız olursa hatırlatmalara ve dosyalara dokunulmamış olur.
        await repository.replaceAll(valid);
        // Veritabanı yazıldı: ekran hemen yeni veriyi gösterir. Bundan sonraki adımlar (dosya ve bildirim
        // uzlaştırması) hata verse bile geri yükleme "başarısız" sayılmaz; kullanıcıya doğru durum bildirilir.
        setData(valid);
        // Yedek davetiye fotoğrafı içermez; yeni veride kullanılmayan eski fotoğraf dosyaları temizlenir.
        const kept = new Set(valid.invitationDesigns.map((item) => item.photoUri));
        for (const old of data.invitationDesigns)
          if (old.photoUri && !kept.has(old.photoUri)) await removeInvitationPhoto(old.photoUri);
        // Eski planlı hatırlatmalar (eski görev başlıklarıyla) iptal edilir; yenileri yalnız izin varsa kurulur.
        try {
          await cancelAllScheduledReminders();
        } catch {
          // Eski hatırlatmalar bir sonraki açılışta yetim olarak iptal edilir.
        }
        let tasks = valid.tasks;
        let remindersRestored = 0;
        if (enabled) {
          for (const task of reminderTasks) {
            let id: string | undefined;
            try {
              id = await scheduleTaskReminder(task);
              if (id) await repository.upsertTask({ ...task, notificationId: id });
            } catch {
              if (id) await cancelTaskReminder(id).catch(() => undefined);
              id = undefined;
            }
            if (id) {
              remindersRestored += 1;
              const scheduledId = id;
              tasks = tasks.map((item) => (item.id === task.id ? { ...item, notificationId: scheduledId } : item));
            }
          }
        }
        setData({ ...valid, tasks });
        return {
          notificationsEnabled: enabled,
          notificationsDowngraded: backupEnabled && !enabled,
          remindersRestored,
          // Yedekte hatırlatmalar kapalıysa hiçbir hatırlatma denenmez; "atlandı" sayılmaz.
          remindersSkipped: backupEnabled ? reminderTasks.length - remindersRestored : 0,
        };
      },
      clearAll: async () => {
        // Önce veritabanı: başarısız olursa hiçbir dosya veya bildirim silinmemiş olur ve işlem güvenle tekrarlanabilir.
        await repository.clearAll();
        setData({ ...EMPTY_APP_DATA, profile: { ...EMPTY_APP_DATA.profile } });
        // Veritabanı temizlendikten sonra dış kalıntılar bağımsız temizlenir; biri başarısız olsa da diğerleri denenir
        // ve kalanlar kullanıcıya bildirilir. İşlem idempotenttir: tekrar çalıştırmak güvenlidir.
        const leftovers: DeleteLeftover[] = [];
        const attempt = async (kind: DeleteLeftover, work: () => Promise<unknown> | boolean) => {
          try {
            if ((await work()) === false) leftovers.push(kind);
          } catch {
            leftovers.push(kind);
          }
        };
        await attempt('reminders', clearAllNotifications);
        await attempt('invitationPhotos', removeAllInvitationPhotos);
        await attempt('personalInvitations', removeAllPersonalInvitationFiles);
        await attempt('exportFiles', () => removeAllExportFiles().failed === 0);
        await attempt('temporaryFiles', () => removeInvitationTempFiles().failed === 0);
        return { leftovers };
      },
    }),
    [createId, data, error, loading, refresh, removeEntity, updateEntity],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
