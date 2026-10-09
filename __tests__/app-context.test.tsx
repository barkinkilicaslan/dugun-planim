import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppProvider, useApp } from '@/context/app-context';
import { repository } from '@/data/repository';
jest.mock('@/data/repository', () => ({
  repository: {
    initialize: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue({
      profile: {
        couple1Name: 'Ada',
        couple2Name: 'Deniz',
        weddingDate: '2027-01-01',
        estimatedBudgetCents: 100,
        estimatedGuestCount: 2,
        currency: 'TRY',
        theme: 'system',
        dateFormat: 'DD.MM.YYYY',
        notificationsEnabled: false,
        onboardingCompleted: true,
      },
      tasks: [],
      guests: [],
      tables: [],
      venueLayoutItems: [],
      budgetItems: [],
      vendors: [],
      notes: [{ id: 'n1', title: 'Test', content: 'Yerel', createdAt: 'x', updatedAt: 'x' }],
    }),
    clearAll: jest.fn(),
    saveProfile: jest.fn(),
    replaceAll: jest.fn(),
    upsertTask: jest.fn(),
    deleteTask: jest.fn(),
    upsertGuest: jest.fn(),
    deleteGuest: jest.fn(),
    upsertTable: jest.fn(),
    deleteTable: jest.fn(),
    upsertVenueLayoutItem: jest.fn(),
    deleteVenueLayoutItem: jest.fn(),
    upsertBudgetItem: jest.fn(),
    deleteBudgetItem: jest.fn(),
    upsertVendor: jest.fn(),
    deleteVendor: jest.fn(),
    upsertNote: jest.fn(),
    deleteNote: jest.fn(),
  },
}));
jest.mock('@/services/notifications', () => ({
  clearAllNotifications: jest.fn().mockResolvedValue(undefined),
  getNotificationPermission: jest.fn().mockResolvedValue('denied'),
  cancelAllScheduledReminders: jest.fn().mockResolvedValue(undefined),
  cancelOrphanedReminders: jest.fn().mockResolvedValue(0),
  resetNotificationConsent: jest.fn().mockResolvedValue(undefined),
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));

describe('all data deletion', () => {
  it('completes onboarding without generating overdue starter tasks', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () =>
      result.current.completeOnboarding(
        {
          couple1Name: 'Zeynep',
          couple2Name: 'Emre',
          weddingDate: '2027-08-15',
          estimatedBudgetCents: 45000000,
          estimatedGuestCount: 120,
          currency: 'TRY',
          theme: 'system',
          dateFormat: 'DD.MM.YYYY',
          notificationsEnabled: false,
          onboardingCompleted: false,
          adultsOnly: false,
          adultsOnlyMessage: '',
        },
        false,
      ),
    );
    expect(repository.replaceAll).toHaveBeenCalledWith(expect.objectContaining({ tasks: [] }));
    expect(result.current.data.tasks).toEqual([]);
  });

  it('clears persistence and returns state to onboarding-safe empty data', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.notes).toHaveLength(1);
    await act(async () => result.current.clearAll());
    expect(repository.clearAll).toHaveBeenCalled();
    expect(result.current.data.notes).toEqual([]);
    expect(result.current.data.profile.onboardingCompleted).toBe(false);
  });

  it('removes the linked drawing item and unassigns guests when a seating table is deleted', async () => {
    const now = '2026-08-01T12:00:00.000Z';
    (repository.load as jest.Mock).mockResolvedValueOnce({
      profile: {
        couple1Name: 'Ada',
        couple2Name: 'Deniz',
        weddingDate: '2027-01-01',
        estimatedBudgetCents: 100,
        estimatedGuestCount: 2,
        currency: 'TRY',
        theme: 'system',
        dateFormat: 'DD.MM.YYYY',
        notificationsEnabled: false,
        onboardingCompleted: true,
      },
      tasks: [],
      guests: [
        {
          id: 'g1',
          name: 'Ada',
          phone: '',
          side: 'common',
          partySize: 2,
          childCount: 0,
          rsvp: 'attending',
          notes: '',
          mealNotes: '',
          group: 'friends',
          tableId: 't1',
          createdAt: now,
          updatedAt: now,
        },
      ],
      tables: [{ id: 't1', name: 'Masa 1', capacity: 8, createdAt: now, updatedAt: now }],
      venueLayoutItems: [
        {
          id: 'layout-1',
          type: 'table',
          label: 'Masa 1',
          x: 0.1,
          y: 0.1,
          width: 0.2,
          height: 0.2,
          rotation: 0,
          shape: 'round',
          locked: false,
          tableId: 't1',
          createdAt: now,
          updatedAt: now,
        },
      ],
      budgetItems: [],
      vendors: [],
      notes: [],
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
    const { result } = await renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => result.current.deleteTable('t1'));
    expect(result.current.data.tables).toEqual([]);
    expect(result.current.data.venueLayoutItems).toEqual([]);
    expect(result.current.data.guests[0].tableId).toBeUndefined();
  });
});
