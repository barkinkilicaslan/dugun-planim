import { render } from '@testing-library/react-native';

import { ProgressBar } from '@/components/ui/progress';
import { getTheme, type ThemeId } from '@/constants/themes';

let mockThemeId: ThemeId = 'bohemian-sunset';
jest.mock('@/context/theme-context', () => ({
  useAppTheme: () => jest.requireActual('@/constants/themes').getTheme(mockThemeId),
}));

const stepCount = (view: Awaited<ReturnType<typeof render>>) =>
  // Adımlar erişilebilirlik ağacından gizlenir; dolu olanlar arka plan rengiyle ayırt edilir.
  view.getByLabelText('x', { includeHiddenElements: true }).children.length;

describe('stepped progress indicators never misreport the real value', () => {
  const stepped: ThemeId[] = ['mediterranean-dream', 'bohemian-sunset', 'wildflower-meadow'];

  function filledSteps(view: Awaited<ReturnType<typeof render>>, themeId: ThemeId) {
    const fill = getTheme(themeId).colors.progressFill;
    const bar = view.getByLabelText('x', { includeHiddenElements: true });
    return (bar.children as unknown as { props: { style: unknown } }[]).filter((child) => {
      const flat = JSON.stringify(child.props.style);
      return flat.includes(fill);
    }).length;
  }

  it.each(stepped)('%s: 0%% is empty, 1–4%% shows one step, 95–99%% is never full, 100%% is full', async (id) => {
    mockThemeId = id;
    const counts: Record<number, number> = {};
    for (const value of [0, 1, 4, 50, 95, 99, 100]) {
      const view = await render(<ProgressBar value={value} label="x" />);
      expect(stepCount(view)).toBe(10);
      counts[value] = filledSteps(view, id);
      expect(view.getByLabelText('x', { includeHiddenElements: true }).props.accessibilityValue).toMatchObject({
        now: value,
        min: 0,
        max: 100,
      });
      await view.unmount();
    }
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBe(1);
    expect(counts[4]).toBe(1);
    expect(counts[50]).toBe(5);
    expect(counts[95]).toBe(9);
    expect(counts[99]).toBe(9);
    expect(counts[100]).toBe(10);
  });

  it('keeps the glow of Midnight Glamour from being clipped', async () => {
    mockThemeId = 'midnight-glamour';
    const view = await render(<ProgressBar value={40} label="x" />);
    const bar = view.getByLabelText('x', { includeHiddenElements: true });
    const flat = Object.assign({}, ...[bar.props.style].flat(Infinity).filter(Boolean));
    expect(flat.overflow).toBe('visible');
  });

  it('still clips the plain bar so rounded ends stay clean', async () => {
    mockThemeId = 'romantic-garden';
    const view = await render(<ProgressBar value={40} label="x" />);
    const flat = Object.assign(
      {},
      ...[view.getByLabelText('x', { includeHiddenElements: true }).props.style].flat(Infinity).filter(Boolean),
    );
    expect(flat.overflow).toBe('hidden');
  });
});
