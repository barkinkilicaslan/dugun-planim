import { fireEvent, render } from '@testing-library/react-native';
import { Button } from '@/components/ui/button';

jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({
    colors: {
      primary: '#6F1D3A',
      danger: '#A33838',
      surfaceAlt: '#eee',
      surface: '#fff',
      border: '#ddd',
      primaryText: '#fff',
      text: '#222',
    },
  }),
}));

describe('Button', () => {
  it('exposes an accessible button and handles press', async () => {
    const onPress = jest.fn();
    const view = await render(<Button label="Kaydet" onPress={onPress} />);
    await fireEvent.press(view.getByLabelText('Kaydet'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('does not handle press when disabled', async () => {
    const onPress = jest.fn();
    const view = await render(<Button label="Sil" onPress={onPress} disabled />);
    await fireEvent.press(view.getByLabelText('Sil'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
