# Düğün Planım

Hesap gerektirmeyen, offline-first düğün planlama uygulaması. Görevler, davetliler, özelleştirilebilir salon/masa planı, bütçe, ödemeler, tedarikçiler, takvim ve notlar tek bir yerel SQLite veritabanında tutulur.

Salon düzenleyicisinde masalar, sahne, dans pisti, giriş, DJ ve ikram alanı mekâna göre sürüklenebilir; boyut, açı ve masa şekli değiştirilebilir, öğeler yanlışlıkla taşınmaması için kilitlenebilir. Düzen cihazda saklanır, masa ekranında önizlenir ve PDF masa planına eklenir.

## Teknoloji ve gereksinimler

- Expo SDK 57, React Native 0.86.2, React 19.2.3 ve TypeScript strict mode
- Expo Router ile Android, iOS ve web yönlendirmesi
- Node.js `>=22.13.0` ve npm
- Tam native doğrulama için Android Studio/JDK veya EAS hesabı; iOS production build için Apple Developer + EAS hesabı

## Yerel çalıştırma

```powershell
npm install
Copy-Item .env.example .env.local
npm run start
```

Expo geliştirme sunucusunda Android, iOS veya web hedefi seçilebilir. SQLite, yerel bildirim ve paylaşım davranışlarının tamamını sınamak için Expo Go yerine development build önerilir.

```powershell
npm run android
npm run ios
npm run web
```

Hukuki site ayrı bir statik uygulamadır:

```powershell
Set-Location legal-site
npm install
npm run dev
npm test
```

## Kalite komutları

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run assets:check
npm run doctor
npm run export:web
```

Toplu kontrol: `npm run check`. Gerçekleşen sonuçlar [TEST_REPORT.md](./TEST_REPORT.md) içinde tutulur.

## Veri ve gizlilik

- Uygulama hesabı, backend, reklam, analiz, abonelik veya izleme SDK'sı yoktur.
- Kullanıcı verileri `dugun-planim.db` SQLite veritabanında cihaz içinde kalır.
- Bildirim izni ancak onboarding açıklamasından sonra açık kullanıcı seçimiyle istenir.
- JSON yedek, CSV ve PDF yalnız kullanıcı eylemiyle sistem dosya/paylaşım arayüzüne çıkar.
- JSON yedek davetiye tasarımlarını içerir ancak davetiye fotoğraflarını içermez; uygulama bunu yedek almadan önce ve geri yüklemeden sonra açıkça bildirir. Geri yüklemede fotoğraf alanı boş kalır.
- İçe aktarılan dosyalar boyut, format, sürüm ve entity düzeyinde doğrulanır.
- “Tüm verilerimi sil” iki onaydan sonra veritabanını ve planlanmış yerel bildirimleri temizler.

Ayrıntılı veri akışı: [PRIVACY_DATA_MAP.md](./PRIVACY_DATA_MAP.md).

## Doğrudan bağımlılıklar

| Grup                                                                                    | Amaç                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `expo`, `react`, `react-native`, `react-dom`, `react-native-web`                        | Uygulama çalışma zamanı ve web önizleme                           |
| `expo-router`, `expo-linking`, `react-native-screens`, `react-native-safe-area-context` | Dosya tabanlı yönlendirme, bağlantılar, native ekran ve safe-area |
| `expo-sqlite`                                                                           | Yerel ilişkisel veri, migration, transaction ve web WASM önizleme |
| `expo-secure-store`                                                                     | Bildirim izin kararının küçük güvenli ayarı                       |
| `expo-notifications`                                                                    | Kullanıcı seçimine bağlı yerel görev hatırlatması                 |
| `expo-file-system`, `expo-document-picker`, `expo-sharing`, `expo-print`                | Yedek/CSV/PDF içe-dışa aktarma                                    |
| `expo-localization`                                                                     | Türkçe varsayılan ve İngilizceye hazır sözlük seçimi              |
| `expo-crypto`                                                                           | Yerel entity UUID üretimi                                         |
| `expo-application`, `expo-constants`                                                    | Sürüm ve merkezi runtime yapılandırması                           |
| `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`                               | Native açılış, durum çubuğu ve sistem tema görünümü               |

Tüm doğrudan runtime paketleri MIT lisanslıdır; sürüm ve bildirimler [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) içindedir.

## Yapı ve önemli dosyalar

```text
src/app/          Expo Router ekranları
src/components/   Erişilebilir ortak UI
src/context/      Uygulama ve tema durumu
src/domain/       Saf modeller, hesaplamalar, CSV/yedek doğrulama
src/data/         SQLite migration ve repository
src/services/     Bildirim, dosya, paylaşım ve PDF servisleri
src/i18n/         Tür güvenli Türkçe/İngilizce sözlük altyapısı
assets/           Marka, uygulama ve mağaza varlıkları
store-listing/    App Store / Google Play metinleri ve ekran görüntüleri
legal-site/       Yerel, yayınlanabilir gizlilik/destek sitesi
```

Tek noktadan paket kimliği, URL ve destek e-postası `app.config.ts` ile `.env.local` üzerinden değiştirilir. Site karşılıkları `legal-site/site-config.ts` ve site ortam değişkenleridir.

## Production build

```powershell
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform android --profile production
npx eas-cli@latest submit --platform ios --profile production
```

Production Android profili AAB üretir. Hesap, imzalama ve mağaza sahibi girdileri olmadan çalıştırılamayan son adımlar [RELEASE_INPUTS.md](./RELEASE_INPUTS.md) ve [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) içinde açıkça ayrılmıştır.

## Diller

Uygulama Türkçe ve İngilizce destekler. Ayarlar → Dil içinde **Otomatik** (varsayılan), **Türkçe** ve **English** seçilebilir. Otomatik modda cihazın dil kodu (`tr`, `en`, `en-US`, `en-GB` …) kullanılır; ülke dikkate alınmaz, desteklenmeyen dillerde Türkçe gösterilir. Seçim yeniden başlatma gerektirmeden uygulanır ve `expo-sqlite/kv-store` içinde (düğün veritabanından ayrı) saklanır; yedek dosyasına girmez.

Çeviriler `src/i18n/tr.ts` (kaynak) ve `src/i18n/en.ts` içindedir; İngilizce sözlük aynı anahtar ve parametre yapısını taşımak zorundadır (derleme zamanı denetimi). Ekranlarda `useI18n()` kullanılır. Kullanıcının yazdığı isimler, notlar ve davet metinleri çevrilmez. CSV içe aktarma başlıkları dosya uyumluluğu için Türkçe kalır. Sağdan sola dil desteği henüz yoktur; mimari `direction` bilgisini taşır.

İzin metinleri ve uygulama adı `locales/` altındaki dosyalarla cihaz diline göre yerelleştirilir (`expo-localization` eklentisi).

## Kapsam kararları

Sözleşme dosyası ekleme kapsam dışıdır. Telefon rehberi yalnızca kullanıcı “Rehberden davetli ekle” dediğinde okunur (iOS NSContactsUsageDescription, Android yalnız READ_CONTACTS); davetiye fotoğrafı sistem dosya seçicisiyle seçilir ve fotoğraf izni istenmez. Tedarikçi arama/e-posta eylemi ancak ilgili satıra kullanıcı dokunduğunda işletim sistemine devredilir.
