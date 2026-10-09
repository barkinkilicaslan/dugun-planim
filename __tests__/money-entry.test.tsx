import { useState } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import BudgetEditor from '@/app/edit/budget';
import VendorEditor from '@/app/edit/vendor';
import OnboardingScreen from '@/app/onboarding';
import { MoneyField } from '@/components/ui/money-field';
import { createTranslator, getActiveLocale, setActiveLocale } from '@/i18n';

const TR = createTranslator('tr');

const mockSaveBudgetItem = jest.fn();
const mockSaveVendor = jest.fn();
const mockCompleteOnboarding = jest.fn();
jest.mock('@/context/app-context', () => ({
  useApp: () => ({
    data: { budgetItems: [], vendors: [], profile: { currency: 'TRY' } },
    createId: () => 'new-id',
    saveBudgetItem: mockSaveBudgetItem,
    deleteBudgetItem: jest.fn(),
    saveVendor: mockSaveVendor,
    deleteVendor: jest.fn(),
    completeOnboarding: mockCompleteOnboarding,
  }),
}));
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
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/components/ui/screen', () => {
  const { View } = require('react-native');
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});
const mockPickerProps: { current?: Record<string, unknown> } = {};
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const DateTimePicker = (props: Record<string, unknown>) => {
    mockPickerProps.current = props;
    return <View testID="native-picker" />;
  };
  return { __esModule: true, default: DateTimePicker, DateTimePickerAndroid: { open: jest.fn() } };
});

beforeEach(() => {
  jest.clearAllMocks();
  setActiveLocale('tr');
});
afterAll(() => setActiveLocale(getActiveLocale()));

function Harness({ initial = 0, onCents }: { initial?: number; onCents: (cents: number) => void }) {
  const [cents, setCents] = useState(initial);
  return (
    <MoneyField
      label="Tutar"
      cents={cents}
      onChangeCents={(value) => {
        setCents(value);
        onCents(value);
      }}
    />
  );
}

describe('MoneyField', () => {
  it('yazarken ondalık ayırıcıyı silmez ve 0 alanı boşaltmaz: 12,5', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness onCents={onCents} />);
    let text = '';
    for (const key of ['1', '2', ',', '5']) {
      text += key;
      await fireEvent.changeText(view.getByLabelText('Tutar'), text);
      expect(view.getByLabelText('Tutar').props.value).toBe(text);
    }
    expect(onCents).toHaveBeenLastCalledWith(1250);
  });

  it('0,5 yazılabilir ("0" yazınca alan boşalmaz)', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness onCents={onCents} />);
    await fireEvent.changeText(view.getByLabelText('Tutar'), '0');
    expect(view.getByLabelText('Tutar').props.value).toBe('0');
    await fireEvent.changeText(view.getByLabelText('Tutar'), '0,');
    expect(view.getByLabelText('Tutar').props.value).toBe('0,');
    await fireEvent.changeText(view.getByLabelText('Tutar'), '0,5');
    expect(view.getByLabelText('Tutar').props.value).toBe('0,5');
    expect(onCents).toHaveBeenLastCalledWith(50);
  });

  it('1.250,50 yapıştırılınca 125050 kuruş olur ve alandan çıkınca normalleşir', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness onCents={onCents} />);
    await fireEvent.changeText(view.getByLabelText('Tutar'), '1.250,50');
    expect(onCents).toHaveBeenLastCalledWith(125050);
    expect(view.getByLabelText('Tutar').props.value).toBe('1.250,50');
    await fireEvent(view.getByLabelText('Tutar'), 'blur');
    expect(view.getByLabelText('Tutar').props.value).toBe('1250,5');
  });

  it('1.500 TL 1,5 TL olmaz: 150000 kuruş', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness onCents={onCents} />);
    await fireEvent.changeText(view.getByLabelText('Tutar'), '1.500');
    expect(onCents).toHaveBeenLastCalledWith(150000);
  });

  it('geçersiz tuş vuruşlarını yok sayar, mevcut değeri bozmaz', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness initial={1250} onCents={onCents} />);
    expect(view.getByLabelText('Tutar').props.value).toBe('12,5');
    for (const bad of ['12,5a', '12,5,', '12,555', '-12,5', '1e3']) {
      await fireEvent.changeText(view.getByLabelText('Tutar'), bad);
      expect(view.getByLabelText('Tutar').props.value).toBe('12,5');
    }
    expect(onCents).not.toHaveBeenCalled();
  });

  it('alanı temizlemek 0 kuruş bildirir ve boş gösterir', async () => {
    const onCents = jest.fn();
    const view = await render(<Harness initial={1250} onCents={onCents} />);
    await fireEvent.changeText(view.getByLabelText('Tutar'), '');
    expect(onCents).toHaveBeenLastCalledWith(0);
    expect(view.getByLabelText('Tutar').props.value).toBe('');
  });

  it('dışarıdan değişen değeri (ör. yedek geri yükleme) gösterir', async () => {
    const view = await render(<MoneyField label="Tutar" cents={1250} onChangeCents={jest.fn()} />);
    expect(view.getByLabelText('Tutar').props.value).toBe('12,5');
    await view.rerender(<MoneyField label="Tutar" cents={99900} onChangeCents={jest.fn()} />);
    expect(view.getByLabelText('Tutar').props.value).toBe('999');
  });

  it('İngilizce arayüzde nokta ondalık, virgül binliktir', async () => {
    setActiveLocale('en');
    const onCents = jest.fn();
    const view = await render(<Harness onCents={onCents} />);
    await fireEvent.changeText(view.getByLabelText('Tutar'), '1,250.5');
    expect(onCents).toHaveBeenLastCalledWith(125050);
    await fireEvent(view.getByLabelText('Tutar'), 'blur');
    expect(view.getByLabelText('Tutar').props.value).toBe('1250.5');
  });
});

describe('bütçe kalemi ekranı', () => {
  it('Türkçe tutarları kayıpsız kaydeder (planlanan 1.250,50, gerçekleşen 12,5, ödenen 0,5)', async () => {
    const view = await render(<BudgetEditor />);
    await fireEvent.changeText(view.getByLabelText(TR('budgetEditor.name')), 'Salon');
    await fireEvent.changeText(view.getByLabelText(TR('budgetEditor.category')), 'Mekân');
    await fireEvent.changeText(view.getByLabelText(TR('budgetEditor.planned', { currency: 'TRY' })), '1.250,50');
    for (const text of ['1', '12', '12,', '12,5']) {
      await fireEvent.changeText(view.getByLabelText(TR('budgetEditor.actual', { currency: 'TRY' })), text);
    }
    for (const text of ['0', '0,', '0,5']) {
      await fireEvent.changeText(view.getByLabelText(TR('budgetEditor.paid', { currency: 'TRY' })), text);
    }
    await fireEvent.press(view.getByLabelText(TR('common.save')));
    expect(mockSaveBudgetItem).toHaveBeenCalledWith(
      expect.objectContaining({ plannedCents: 125050, actualCents: 1250, paidCents: 50 }),
    );
  });
});

describe('tedarikçi ekranı', () => {
  it('teklif tutarını 1.500,25 olarak kaydeder', async () => {
    const view = await render(<VendorEditor />);
    await fireEvent.changeText(view.getByLabelText(TR('vendorEditor.name')), 'Foto Stüdyo');
    await fireEvent.changeText(view.getByLabelText(TR('vendorEditor.category')), 'Fotoğraf');
    await fireEvent.changeText(view.getByLabelText(TR('vendorEditor.quote', { currency: 'TRY' })), '1.500,25');
    await fireEvent.press(view.getByLabelText(TR('common.save')));
    expect(mockSaveVendor).toHaveBeenCalledWith(expect.objectContaining({ quoteCents: 150025 }));
  });
});

describe('onboarding bütçesi', () => {
  it('"1.250,50" bütçesi ve 120 davetli ile kurulumu tamamlar', async () => {
    const view = await render(<OnboardingScreen />);
    await fireEvent.press(view.getByLabelText(TR('onboarding.start')));
    await fireEvent.changeText(view.getByLabelText('Birinci isim'), 'Ece');
    await fireEvent.changeText(view.getByLabelText('İkinci isim'), 'Mert');
    await fireEvent.press(view.getByLabelText(TR('common.continue')));
    await fireEvent.press(view.getByLabelText(/Düğün tarihi: seçilmedi/));
    const future = new Date(Date.now() + 400 * 24 * 3600 * 1000);
    await act(async () => (mockPickerProps.current?.onValueChange as (event: unknown, date: Date) => void)({}, future));
    await fireEvent.changeText(view.getByLabelText(TR('onboarding.budgetEstimate')), '1.250,50');
    await fireEvent.changeText(view.getByLabelText(TR('onboarding.guestEstimate')), '120');
    await fireEvent.press(view.getByLabelText(TR('common.continue')));
    await fireEvent.press(view.getByLabelText(TR('onboarding.skipAndFinish')));
    expect(mockCompleteOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({ estimatedBudgetCents: 125050, estimatedGuestCount: 120 }),
      false,
    );
  });
});
