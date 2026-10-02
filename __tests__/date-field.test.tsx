import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import OnboardingScreen from '@/app/onboarding';
import { DateField, TimeField } from '@/components/ui/date-field';

const mockPickerProps: { current?: Record<string, unknown> } = {};
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const DateTimePicker = (props: Record<string, unknown>) => {
    mockPickerProps.current = props;
    return <View testID="native-picker" />;
  };
  return { __esModule: true, default: DateTimePicker, DateTimePickerAndroid: { open: jest.fn() } };
});

const mockCompleteOnboarding = jest.fn();
jest.mock('@/context/app-context', () => ({ useApp: () => ({ completeOnboarding: mockCompleteOnboarding }) }));
jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    dark: false,
    colors: {
      primary: '#6F1D3A',
      muted: '#666',
      warning: '#995500',
      danger: '#a33',
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

describe('DateField', () => {
  it('shows the Turkish GG.AA.YYYY format with a spoken Turkish label', async () => {
    const view = await render(<DateField label="Düğün tarihi" value="2026-10-02" onChange={jest.fn()} />);
    expect(view.getByText('02.10.2026 · 2 Ekim 2026 Cuma')).toBeTruthy();
    expect(view.getByLabelText('Düğün tarihi: 02.10.2026 · 2 Ekim 2026 Cuma. Değiştirmek için dokunun.')).toBeTruthy();
  });

  it('announces an empty value and opens a Turkish-locale picker limited by the minimum date', async () => {
    const onChange = jest.fn();
    const view = await render(<DateField label="Düğün tarihi" value="" minimumDate="2026-10-02" onChange={onChange} />);
    await fireEvent.press(view.getByLabelText('Düğün tarihi: seçilmedi. Değiştirmek için dokunun.'));
    expect(mockPickerProps.current).toMatchObject({ mode: 'date', locale: 'tr-TR' });
    expect(mockPickerProps.current?.minimumDate).toEqual(new Date(2026, 9, 2, 12, 0, 0, 0));
    const onValueChange = mockPickerProps.current?.onValueChange as (event: unknown, date: Date) => void;
    // Gece yarısına yakın seçim bile aynı takvim gününü verir.
    onValueChange({}, new Date(2027, 2, 28, 23, 59));
    expect(onChange).toHaveBeenCalledWith('2027-03-28');
  });

  it('time field returns HH:MM', async () => {
    const onChange = jest.fn();
    const view = await render(<TimeField label="Düğün saati" value="" onChange={onChange} />);
    await fireEvent.press(view.getByLabelText('Düğün saati: seçilmedi. Değiştirmek için dokunun.'));
    (mockPickerProps.current?.onValueChange as (event: unknown, date: Date) => void)({}, new Date(2000, 0, 1, 18, 5));
    expect(onChange).toHaveBeenCalledWith('18:05');
  });
});

describe('onboarding wedding date', () => {
  it('requires a date picked from the calendar, not typed text', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = await render(<OnboardingScreen />);
    await fireEvent.press(view.getByLabelText('Başlayalım'));
    await fireEvent.changeText(view.getByLabelText('Birinci isim'), 'Ece');
    await fireEvent.changeText(view.getByLabelText('İkinci isim'), 'Mert');
    await fireEvent.press(view.getByLabelText('Devam'));
    expect(view.queryByPlaceholderText('2027-06-12')).toBeNull();
    expect(view.getByLabelText('Düğün tarihi: seçilmedi. Değiştirmek için dokunun.')).toBeTruthy();
    await fireEvent.press(view.getByLabelText('Devam'));
    expect(alert).toHaveBeenCalledWith('Düğün tarihi gerekli', expect.stringContaining('takvimden seçin'));
    alert.mockRestore();
  });

  it('rejects a past date picked in the calendar with a clear message', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = await render(<OnboardingScreen />);
    await fireEvent.press(view.getByLabelText('Başlayalım'));
    await fireEvent.changeText(view.getByLabelText('Birinci isim'), 'Ece');
    await fireEvent.changeText(view.getByLabelText('İkinci isim'), 'Mert');
    await fireEvent.press(view.getByLabelText('Devam'));
    await fireEvent.press(view.getByLabelText('Düğün tarihi: seçilmedi. Değiştirmek için dokunun.'));
    await act(async () =>
      (mockPickerProps.current?.onValueChange as (event: unknown, date: Date) => void)({}, new Date(2020, 0, 5, 12)),
    );
    await fireEvent.press(view.getByLabelText('Devam'));
    expect(alert).toHaveBeenCalledWith('Düğün tarihi gerekli', expect.stringContaining('geçmişte'));
    alert.mockRestore();
  });
});
