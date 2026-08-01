import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import * as Crypto from 'expo-crypto';

import { repository } from '@/data/repository';
import { createTemplateTasks } from '@/domain/templates';
import {
  EMPTY_APP_DATA,
  type AppData,
  type BudgetItem,
  type Guest,
  type NoteItem,
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
  validateNote,
  validateProfile,
  validateTable,
  validateTask,
  validateVendor,
  validateVenueLayoutItem,
} from '@/domain/validation';
import {
  cancelTaskReminder,
  clearAllNotifications,
  requestNotificationConsent,
  scheduleTaskReminder,
} from '@/services/notifications';

type EntityKey = 'tasks' | 'guests' | 'tables' | 'venueLayoutItems' | 'budgetItems' | 'vendors' | 'notes';

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
  replaceAll: (next: AppData) => Promise<void>;
  clearAll: () => Promise<void>;
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
      setError(reason instanceof Error ? reason.message : 'Veriler yüklenemedi.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await repository.initialize();
        const loaded = await repository.load();
        if (active) setData(loaded);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Uygulama başlatılamadı.');
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
          tasks: createTemplateTasks(nextProfile.weddingDate, createId),
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
      replaceAll: async (next) => {
        const valid = validateAppData(next);
        await repository.replaceAll(valid);
        setData(valid);
      },
      clearAll: async () => {
        await clearAllNotifications();
        await repository.clearAll();
        setData({ ...EMPTY_APP_DATA, profile: { ...EMPTY_APP_DATA.profile } });
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
