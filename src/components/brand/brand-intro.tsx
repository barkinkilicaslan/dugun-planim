import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { BRAND, NATIVE_SPLASH_IMAGE_WIDTH } from '@/constants/brand';
import { useI18n } from '@/context/language-context';

/** Tanıtım görünümünün en az kalacağı süre (ms). Dokunarak daha erken geçilebilir. */
export const INTRO_MIN_MS = 1300;
/** Uygulama bu sürede hazır olmazsa tanıtım kapanır ve altındaki yükleme/hata ekranı görünür (ms). */
export const INTRO_MAX_MS = 8000;
const FADE_OUT_MS = 240;
const RIBBON_WIDTH = 280;

/** Native açılış ekranı yalnız bir kez gösterilir; JS bağlamı yaşadığı sürece (arka plana alma dahil) tekrar çalışmaz. */
let introPlayed = false;
/** Yalnız testler için: soğuk açılışı yeniden benzetir. */
export function resetIntroForTests() {
  introPlayed = false;
}

const WORDMARK_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    try {
      void AccessibilityInfo.isReduceMotionEnabled?.()
        .then((value) => {
          if (active) setReduce(Boolean(value));
        })
        .catch(() => undefined);
      const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) =>
        setReduce(Boolean(value)),
      );
      return () => {
        active = false;
        subscription?.remove?.();
      };
    } catch {
      return () => {
        active = false;
      };
    }
  }, []);
  return reduce;
}

/**
 * Uygulama açılırken gösterilen kısa marka tanıtımı: mercan zemin, krem kurdele ve "Düğün Planım" adı.
 * Native açılış ekranı sistem tarafından uygulama hazır olunca kapanır; bu görünüm onun yerini aynı zeminde ve aynı
 * kurdele boyutunda devralır. `ready` (uygulama verisi yüklendi) ve en az {@link INTRO_MIN_MS} geçince solarak kapanır;
 * ekrana dokunmak süreyi atlar. `failed` ise hemen kapanır ki kullanıcı hata ekranını görsün.
 */
export function BrandIntro({
  ready,
  failed,
  onVisible,
  onDone,
}: {
  ready: boolean;
  failed: boolean;
  /** İlk çizimden sonra çağrılır; native açılış ekranını kapatmak için kullanılır. */
  onVisible: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const reduceMotion = useReduceMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const visibleCalled = useRef(false);
  const doneCalled = useRef(false);
  const [opacity] = useState(() => new Animated.Value(1));
  const [ribbonScale] = useState(() => new Animated.Value(NATIVE_SPLASH_IMAGE_WIDTH / RIBBON_WIDTH));
  const [nameOpacity] = useState(() => new Animated.Value(0));

  const notifyVisible = useCallback(() => {
    if (visibleCalled.current) return;
    visibleCalled.current = true;
    onVisible();
  }, [onVisible]);
  const finish = useCallback(() => {
    if (doneCalled.current) return;
    doneCalled.current = true;
    onDone();
  }, [onDone]);

  // Süre sayacı ve güvenlik sınırı.
  useEffect(() => {
    const minimum = setTimeout(() => setMinElapsed(true), INTRO_MIN_MS);
    const maximum = setTimeout(() => setTimedOut(true), INTRO_MAX_MS);
    // Yerleşim olayı gelmese bile native ekran sonsuza dek kalmasın.
    const fallback = setTimeout(notifyVisible, 600);
    return () => {
      clearTimeout(minimum);
      clearTimeout(maximum);
      clearTimeout(fallback);
    };
  }, [notifyVisible]);

  // Giriş hareketi: kurdele native ekrandaki boyuttan tanıtım boyutuna yumuşakça büyür, ad belirir.
  useEffect(() => {
    if (reduceMotion) {
      ribbonScale.setValue(1);
      nameOpacity.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(ribbonScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(250),
        Animated.timing(nameOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, ribbonScale, nameOpacity]);

  // Çıkış koşulları: hata anında hemen; aksi halde hazır + en az süre geçti; hiçbiri olmasa da güvenlik sınırında.
  const exiting = failed || timedOut || (ready && minElapsed);

  useEffect(() => {
    if (!exiting) return;
    if (reduceMotion) {
      finish();
      return;
    }
    const animation = Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished) finish();
    });
    // Animasyon geri çağrısı hiç gelmese bile (ör. uygulama o anda arka plana alındıysa) tanıtım ekranda takılı kalmaz.
    const guard = setTimeout(finish, FADE_OUT_MS + 150);
    return () => {
      animation.stop();
      clearTimeout(guard);
    };
  }, [exiting, reduceMotion, opacity, finish]);

  return (
    <Animated.View
      testID="brand-intro"
      style={[styles.root, { opacity }]}
      onLayout={notifyVisible}
      accessibilityViewIsModal
    >
      {/* Mercan zeminde durum çubuğu açık renkli olur; tanıtım kapanınca önceki stil geri gelir. */}
      <StatusBar style="light" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={BRAND.name}
        accessibilityHint={t('intro.skip')}
        // Dokunuş "en az süre" beklemesini atlar; uygulama verisi hazır değilse hazır olana kadar tanıtım kalır.
        onPress={() => setMinElapsed(true)}
        style={styles.press}
      >
        <Animated.View style={{ transform: [{ scale: ribbonScale }] }}>
          <Image
            testID="brand-intro-ribbon"
            source={require('../../../assets/images/splash-icon.png')}
            style={styles.ribbon}
            accessible={false}
            importantForAccessibility="no"
          />
        </Animated.View>
        <Animated.View style={[styles.nameWrap, { opacity: nameOpacity }]}>
          <Text testID="brand-intro-name" maxFontSizeMultiplier={1.3} accessibilityRole="header" style={styles.name}>
            {BRAND.name}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Kökte uygulamayı sarar: soğuk açılışta {@link BrandIntro} gösterir, altındaki uygulamayı (yükleme, hata, gezinme)
 * onunla aynı anda hazırlar ve tanıtım sürerken ekran okuyuculardan gizler. Tanıtım kapandıktan sonra (arka plandan
 * dönüş, sekmeler arası gezinme dahil) bir daha gösterilmez; yalnız uygulama süreci yeniden başlayınca tekrar çıkar.
 * `SplashScreen.hideAsync()` burada çağrılır: native ekran, tanıtım çizildikten hemen sonra kapanır.
 */
export function IntroGate({ loading, failed, children }: PropsWithChildren<{ loading: boolean; failed: boolean }>) {
  // Başlangıç değeri saf kalır (StrictMode'da iki kez çalışabilir); "oynatıldı" işareti bağlanınca konur.
  const [visible, setVisible] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);
  const hideSplash = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);
  // Tanıtım yoksa (ör. geliştirme sırasında yeniden yükleme) native ekran eskisi gibi yükleme bitince kapanır.
  useEffect(() => {
    if (!visible && !loading) hideSplash();
  }, [visible, loading, hideSplash]);
  return (
    <View style={styles.flex}>
      <View
        style={styles.flex}
        importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={visible}
      >
        {children}
      </View>
      {visible ? (
        <BrandIntro ready={!loading} failed={failed} onVisible={hideSplash} onDone={() => setVisible(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { ...StyleSheet.absoluteFill, backgroundColor: BRAND.coral, zIndex: 100, elevation: 100 },
  press: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ribbon: { width: RIBBON_WIDTH, height: RIBBON_WIDTH },
  nameWrap: { position: 'absolute', left: 24, right: 24, top: '50%', marginTop: 92, alignItems: 'center' },
  name: {
    color: BRAND.ivory,
    fontFamily: WORDMARK_FONT,
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
