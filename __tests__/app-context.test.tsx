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
  requestNotificationConsent: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));

describe('all data deletion', () => {
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
});
