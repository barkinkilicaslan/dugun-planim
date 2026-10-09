import type { ConfigContext, ExpoConfig } from 'expo/config';

const PACKAGE_ID = process.env.EXPO_PUBLIC_PACKAGE_ID ?? 'com.barkin.dugunplanim';
const PUBLIC_BASE_URL = process.env.EXPO_PUBLIC_LEGAL_BASE_URL ?? 'https://barkinkilicaslan.github.io/dugun-planim';
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'appsupportline@gmail.com';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Düğün Planım',
  slug: 'dugun-planim',
  owner: 'barcopolo',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  scheme: 'dugunplanim',
  userInterfaceStyle: 'automatic',
  description: 'Görev, davetli, bütçe ve masa planını cihazınızda yönetin.',
  primaryColor: '#6F1D3A',
  locales: { tr: './locales/tr.json', en: './locales/en.json' },
  ios: {
    bundleIdentifier: PACKAGE_ID,
    buildNumber: '7',
    supportsTablet: true,
    icon: './assets/images/icon.png',
    infoPlist: {
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: { NSAllowsArbitraryLoads: false, NSAllowsLocalNetworking: true },
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [],
    },
  },
  android: {
    package: PACKAGE_ID,
    versionCode: 1,
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
      // Rehber yalnız okunur; expo-contacts eklentisinin eklediği yazma izni kaldırılır.
      'android.permission.WRITE_CONTACTS',
    ],
    adaptiveIcon: {
      backgroundColor: '#E9596C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  web: { output: 'static', favicon: './assets/images/favicon.png' },
  plugins: [
    [
      'expo-router',
      { headers: { 'Cross-Origin-Embedder-Policy': 'credentialless', 'Cross-Origin-Opener-Policy': 'same-origin' } },
    ],
    [
      'expo-splash-screen',
      {
        // Marka: mercan zemin üstünde krem kurdele. Açık ve koyu sistem görünümünde aynıdır; koyu modda da mercan kalır.
        backgroundColor: '#E9596C',
        dark: { backgroundColor: '#E9596C' },
        image: './assets/images/splash-icon.png',
        imageWidth: 240,
      },
    ],
    'expo-sqlite',
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: false }],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#E9596C',
        defaultChannel: 'reminders',
        mode: 'production',
        enableBackgroundRemoteNotifications: false,
      },
    ],
    'expo-document-picker',
    [
      'expo-contacts',
      {
        contactsPermission:
          'Düğün Planım, yalnızca sizin seçtiğiniz kişileri davetli listenize eklemek için Kişiler’e erişir. Rehberiniz cihazdan dışarı gönderilmez.',
      },
    ],
    [
      'expo-image-picker',
      {
        // iOS: izin metni locales/ altında dile göre yerelleştirilir. Kamera ve mikrofon kullanılmaz.
        photosPermission:
          'Düğün Planım, yalnızca sizin seçtiğiniz davetiye görselini uygulamaya kopyalamak için Fotoğraflar’a erişir. Görsel cihazınızdan dışarı gönderilmez.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    'expo-mail-composer',
    '@react-native-community/datetimepicker',
    'expo-sharing',
    // Uygulama dili Türkçe ve İngilizce; izin metinleri ve uygulama adı cihaz diline göre yerelleştirilir (locales/).
    ['expo-localization', { supportedLocales: { ios: ['tr', 'en'], android: ['tr', 'en'] } }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    legalBaseUrl: PUBLIC_BASE_URL,
    supportEmail: SUPPORT_EMAIL,
    eas: { projectId: '0c2ab3c2-ea63-40f1-a77c-b93e2530c7d2' },
  },
});
