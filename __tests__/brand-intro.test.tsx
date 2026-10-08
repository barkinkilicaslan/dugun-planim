import fs from 'fs';
import path from 'path';
import { AccessibilityInfo, Text } from 'react-native';
import { act, fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { BrandIntro, INTRO_MAX_MS, INTRO_MIN_MS, IntroGate, resetIntroForTests } from '@/components/brand/brand-intro';
import { BRAND, NATIVE_SPLASH_IMAGE_WIDTH } from '@/constants/brand';
import { setActiveLocale } from '@/i18n';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(), preventAutoHideAsync: jest.fn() }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

const ROOT = path.resolve(__dirname, '..');
const hide = SplashScreen.hideAsync as jest.Mock;
let reduceMotion = false;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  reduceMotion = false;
  resetIntroForTests();
  setActiveLocale('tr');
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduceMotion));
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }) as never);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
afterAll(() => setActiveLocale('tr'));

/** Gerçek zamanı taklit eder: React durum/efekt zincirleri her 100 ms'lik adımda işlenir. */
const flush = async (ms: number) => {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    await act(async () => {
      jest.advanceTimersByTime(Math.min(100, ms - elapsed));
    });
  }
};

async function mountIntro(props: Partial<React.ComponentProps<typeof BrandIntro>> = {}) {
  const onVisible = jest.fn();
  const onDone = jest.fn();
  const view = await render(<BrandIntro ready failed={false} onVisible={onVisible} onDone={onDone} {...props} />);
  return { view, onVisible, onDone };
}

describe('brand intro content', () => {
  it('shows the coral screen, the ivory ribbon and the real "Düğün Planım" text', async () => {
    await mountIntro();
    const name = screen.getByTestId('brand-intro-name');
    expect(name.props.children).toBe('Düğün Planım');
    expect(name.props.children).toBe(BRAND.name);
    const ribbon = screen.getByTestId('brand-intro-ribbon', { includeHiddenElements: true });
    expect((ribbon.props.source as { testUri: string }).testUri).toMatch(/assets\/images\/splash-icon\.png$/);
    expect(JSON.stringify(screen.getByTestId('brand-intro').props.style)).toContain(BRAND.coral);
    expect(JSON.stringify(name.props.style)).toContain(BRAND.ivory);
  });

  it('exposes one skip button with the app name and a localized hint', async () => {
    await mountIntro();
    const button = screen.getByLabelText('Düğün Planım');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityHint).toBe('Açılış ekranını geçmek için dokunun');
  });

  it('uses the English hint in English', async () => {
    setActiveLocale('en');
    await mountIntro();
    expect(screen.getByLabelText('Düğün Planım').props.accessibilityHint).toBe('Tap to skip the intro');
  });

  it('keeps the ribbon image decorative for screen readers', async () => {
    await mountIntro();
    const ribbon = screen.getByTestId('brand-intro-ribbon', { includeHiddenElements: true });
    expect(ribbon.props.accessible).toBe(false);
    expect(ribbon.props.importantForAccessibility).toBe('no');
    expect(ribbon.props.accessibilityLabel).toBeUndefined();
  });
});

describe('brand intro timing', () => {
  it('asks to hide the native splash once it is laid out (and only once)', async () => {
    const { onVisible } = await mountIntro();
    expect(onVisible).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent(screen.getByTestId('brand-intro'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } },
      });
    });
    expect(onVisible).toHaveBeenCalledTimes(1);
    await flush(2000);
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it('never leaves the native splash stuck if the layout event does not arrive', async () => {
    const { onVisible } = await mountIntro();
    await flush(700);
    expect(onVisible).toHaveBeenCalledTimes(1);
  });

  it('stays for about 1.3 seconds, then fades out and finishes', async () => {
    reduceMotion = false;
    const { onDone } = await mountIntro();
    await flush(INTRO_MIN_MS - 100);
    expect(onDone).not.toHaveBeenCalled();
    await flush(100 + 400);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(INTRO_MIN_MS).toBeGreaterThanOrEqual(1000);
    expect(INTRO_MIN_MS).toBeLessThanOrEqual(1500);
  });

  it('waits for the app data even after the minimum time', async () => {
    const { view, onDone } = await mountIntro({ ready: false });
    await flush(INTRO_MIN_MS + 1000);
    expect(onDone).not.toHaveBeenCalled();
    await view.rerender(<BrandIntro ready failed={false} onVisible={jest.fn()} onDone={onDone} />);
    await flush(600);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('lets a tap skip the minimum wait', async () => {
    const { onDone } = await mountIntro();
    await flush(300);
    await fireEvent.press(screen.getByLabelText('Düğün Planım'));
    await flush(400);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a tap does not reveal a half-loaded app: it still waits for the data', async () => {
    const { onDone } = await mountIntro({ ready: false });
    await fireEvent.press(screen.getByLabelText('Düğün Planım'));
    await flush(1000);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('closes immediately on a start-up error so the error screen is not hidden', async () => {
    reduceMotion = true;
    const { onDone } = await mountIntro({ ready: false, failed: true });
    await flush(0);
    await act(async () => undefined);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('gives up after the safety limit instead of covering the app forever', async () => {
    const { onDone } = await mountIntro({ ready: false });
    await flush(INTRO_MAX_MS + 600);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('skips animations when reduce motion is on', async () => {
    reduceMotion = true;
    const { onDone } = await mountIntro();
    await act(async () => undefined);
    await flush(INTRO_MIN_MS);
    // Solma animasyonu yok: en az süre dolunca hemen biter.
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('cold start only (IntroGate)', () => {
  const tree = (loading: boolean, failed = false) => (
    <IntroGate loading={loading} failed={failed}>
      <Text testID="app-content">uygulama</Text>
    </IntroGate>
  );

  it('shows the intro on a cold start and hides the app from screen readers meanwhile', async () => {
    await render(tree(true));
    expect(screen.getByTestId('brand-intro')).toBeTruthy();
    const content = screen.getByTestId('app-content', { includeHiddenElements: true });
    expect(isHiddenFromAccessibility(content)).toBe(true);
  });

  it('prepares the app underneath and then removes the intro for good', async () => {
    reduceMotion = true;
    const view = await render(tree(true));
    expect(screen.getByTestId('app-content', { includeHiddenElements: true })).toBeTruthy();
    await view.rerender(tree(false));
    await act(async () => undefined);
    await flush(INTRO_MIN_MS + 50);
    expect(screen.queryByTestId('brand-intro')).toBeNull();
    expect(isHiddenFromAccessibility(screen.getByTestId('app-content'))).toBe(false);
  });

  it('does not come back when the user returns to the app or the content changes', async () => {
    reduceMotion = true;
    const view = await render(tree(false));
    await act(async () => undefined);
    await flush(INTRO_MIN_MS + 50);
    expect(screen.queryByTestId('brand-intro')).toBeNull();
    // Arka plandan dönüş / gezinme: kök yeniden çizilir, yükleme durumu oynasa bile tanıtım tekrar çıkmaz.
    await view.rerender(tree(true));
    await view.rerender(tree(false));
    await flush(INTRO_MIN_MS * 2);
    expect(screen.queryByTestId('brand-intro')).toBeNull();
  });

  it('is not shown again when the root is mounted again in the same app process', async () => {
    reduceMotion = true;
    const first = await render(tree(false));
    await act(async () => undefined);
    await first.unmount();
    await render(tree(false));
    expect(screen.queryByTestId('brand-intro')).toBeNull();
  });

  it('closes the native splash right after the intro is drawn', async () => {
    await render(tree(true));
    await flush(700);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('falls back to closing the native splash when the app is ready and there is no intro', async () => {
    const first = await render(tree(true));
    await act(async () => undefined);
    await first.unmount();
    hide.mockClear();
    const view = await render(tree(true));
    expect(hide).not.toHaveBeenCalled();
    await view.rerender(tree(false));
    expect(hide).toHaveBeenCalledTimes(1);
  });
});

describe('brand constants stay in sync with the native configuration', () => {
  const config = fs.readFileSync(path.join(ROOT, 'app.config.ts'), 'utf8');

  it('uses the same coral for the native splash (light and dark), adaptive icon and notifications', () => {
    const coral = BRAND.coral;
    expect(config.match(new RegExp(`backgroundColor: '${coral}'`, 'g'))?.length).toBeGreaterThanOrEqual(3);
    expect(config).toContain(`dark: { backgroundColor: '${coral}' }`);
    expect(config).toContain(`color: '${coral}'`);
  });

  it('starts the intro ribbon at the native splash image size', () => {
    expect(config).toContain(`imageWidth: ${NATIVE_SPLASH_IMAGE_WIDTH}`);
  });

  it('has readable large text: ivory on coral is at least 3:1', () => {
    const lum = (hex: string) => {
      const c = (i: number) => {
        const v = parseInt(hex.slice(i, i + 2), 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * c(1) + 0.7152 * c(3) + 0.0722 * c(5);
    };
    const [hi, lo] = [lum(BRAND.ivory), lum(BRAND.coral)].sort((a, b) => b - a);
    // Ad 32 pt kalın: WCAG "büyük metin" eşiği 3:1.
    expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(3);
  });

  it('does not link the app to design-concepts', () => {
    expect(config).not.toContain('design-concepts');
    expect(fs.readFileSync(path.join(ROOT, 'src/components/brand/brand-intro.tsx'), 'utf8')).not.toContain(
      'design-concepts',
    );
  });
});
