import { fireEvent, render } from '@testing-library/react-native';
import OnboardingScreen from '@/app/onboarding';

const mockCompleteOnboarding = jest.fn();
jest.mock('@/context/app-context', () => ({ useApp: () => ({ completeOnboarding: mockCompleteOnboarding }) }));
jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    colors: {
      primary: '#6F1D3A',
      muted: '#666',
      warning: '#995500',
      surface: '#fff',
      surfaceAlt: '#eee',
      text: '#222',
      border: '#ddd',
      primaryText: '#fff',
    },
  }),
}));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('@/components/ui/screen', () => {
  const { View } = require('react-native');
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

describe('first launch onboarding', () => {
  it('does not expose the main app before collecting required setup fields', async () => {
    const view = await render(<OnboardingScreen />);
    expect(view.getByText('Her ayrıntı, tek bir sakin planda.')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Başlayalım'));
    expect(view.getByLabelText('Birinci isim')).toBeTruthy();
    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  });
});
