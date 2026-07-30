import { render } from '@testing-library/react-native';

import { ListRow } from '@/components/ui/list-row';

jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => ({ colors: { primary: '#6F1D3A', text: '#241E20', muted: '#6F6468', border: '#DED2C5' } }),
}));

it('wraps a text leading symbol in a native text component', async () => {
  const view = await render(<ListRow title="Ayarlar" leading="⚙" />);

  expect(view.getByText('⚙')).toBeTruthy();
});
