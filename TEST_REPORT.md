# Test Raporu

Tarih: 30 Temmuz 2026

Sürüm: 1.0.0 (1)

Ortam: Windows, Node 24.4.1; Expo SDK 57 web runtime. Native SDK/emülatör ve mağaza hesapları bu makinede yoktur.

## Otomatik kontroller

| Kontrol                         | Sonuç  | Kanıt                                                                                    |
| ------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| TypeScript strict               | PASS   | `npm run typecheck`                                                                      |
| ESLint                          | PASS   | `npm run lint`                                                                           |
| Prettier                        | PASS   | `npm run format:check`                                                                   |
| Expo Doctor                     | PASS   | v1.20.1, 20/20                                                                           |
| Jest                            | PASS   | 10 suite, 26 test                                                                        |
| Jest coverage                   | PASS   | %77,41 statement; domain %84,21 statement                                                |
| Expo web production export      | PASS   | 24 statik rota, `dist/`                                                                  |
| Android config-plugin prebuild  | PASS   | Engellenen legacy izinler `tools:node="remove"`; ikon/splash/manifest üretildi           |
| Hukuki site build/rota testleri | PASS   | 5 rota                                                                                   |
| Uygulama production audit       | REVIEW | Expo/Jest build araç zincirinde transitif advisory; kırıcı `--force` önerisi uygulanmadı |
| Hukuki site production audit    | REVIEW | Next 16.2.12; bundled PostCSS/Sharp için güvenli non-breaking çözüm henüz yok            |

## Test kapsamı

| Alan                                       | Sonuç                 | Not                                                                              |
| ------------------------------------------ | --------------------- | -------------------------------------------------------------------------------- |
| Bütçe toplam/gerçekleşen/ödenen/kalan/aşım | PASS                  | Kuruş tamsayılarıyla birim testleri                                              |
| Davetli toplamları ve masa kapasitesi      | PASS                  | RSVP, parti büyüklüğü ve kapasite engeli                                         |
| Tarih, geri sayım ve DST sınırı            | PASS                  | Yerel takvim günü karşılaştırması                                                |
| Görev ilerleme/gecikme                     | PASS                  | Saf domain testleri + UI smoke                                                   |
| Migration sırası/şema                      | PASS                  | Migration testleri ve web SQLite gerçek açılış                                   |
| JSON yedek/geri yükleme                    | PASS                  | Geçerli, bozuk, yanlış sürüm, aşırı büyük dosya                                  |
| CSV quote/başlık/satır doğrulama           | PASS                  | Birim testleri                                                                   |
| Tüm verileri silme                         | PASS                  | Repository/context testi; iki onay UI kodu ve browser gözlemi                    |
| İlk açılış/onboarding                      | PASS                  | Component testi + dört adımlı browser akışı                                      |
| Bildirim izni reddi/geçme                  | PASS (web akışı)      | “Şimdilik geç” sonrası uygulama eksiksiz açıldı; native OS prompt ayrıca gerekli |
| Açık/koyu/sistem tema                      | PASS (responsive web) | Sistem koyu görünüm ve ayarlardan açık tema browser QA ile görüldü               |
| Erişilebilir buton/44px/list-row           | PASS                  | Component testleri, semantik DOM snapshot, görsel QA                             |
| Yerelleştirme altyapısı                    | PASS                  | Türkçe fallback ve İngilizce katalog testi                                       |

## Uçtan uca browser smoke testi

PASS:

1. SQLite web WASM başladı; ilk açılış onboarding dışında ana ekran göstermedi.
2. Ece/Mert, 2027-06-12, ₺650.000 ve 180 davetli hedefi kaydedildi.
3. Bildirim adımı atlandı; 10 tarihli görev şablonu oluştu.
4. Davetli eklendi, bütçe kalemi eklendi, görev tamamlandı; ana ekran özetleri anında güncellendi.
5. Sayfa yenilendi; SQLite verileri korundu.
6. Görev arama/filtreleri, davetli CSV kontrolleri, bütçe dağılımı ve tüm alt menü rotaları erişilebilir DOM'da göründü.
7. Telefon (430 CSS px) ve tablet (1024 CSS px) düzenleri görsel olarak incelendi; gerçek UI kaynakları mağaza görsellerine dönüştürüldü.
8. Ham metin simgesinin `View` içine düşmesi ve dar ekran para satır kırması bulundu, düzeltildi ve yeniden doğrulandı.
9. Hukuki sitenin beş rotası, mobil responsive DOM'u, skip link'i ve gizlilik içeriği doğrulandı; konsol hatası yok.

## Çalıştırılmayan / hesapla bloklu kontroller

| Kontrol                          | Durum   | Neden / sonraki adım                                                |
| -------------------------------- | ------- | ------------------------------------------------------------------- |
| Küçük/büyük gerçek Android cihaz | NOT RUN | Android SDK/JDK/emülatör yok; EAS development/preview build gerekli |
| Gerçek iPhone/iPad               | NOT RUN | Windows ortamında Xcode yok; EAS/TestFlight gerekli                 |
| Native bildirim/izin             | NOT RUN | Development build ve fiziksel cihaz gerekli                         |
| Native dosya seçici/paylaşım/PDF | NOT RUN | Android/iOS development build gerekli                               |
| Gerçek uçak modu                 | NOT RUN | Fiziksel cihaz doğrulaması release checklist'te                     |
| Android production `.aab`        | BLOCKED | EAS/Google hesabı ve imzalama girdisi verilmedi                     |
| iOS production `.ipa`            | BLOCKED | EAS/Apple Developer hesabı ve imzalama girdisi verilmedi            |

Bu iki production artifact üretilmeden proje “mağazaya gönderildi” veya tüm tamamlanma tanımı sağlandı diye işaretlenmez.

## Güvenlik audit notu

`npm audit fix` kırıcı olmayan güncellemeleri uyguladı. Kalan advisory yolları Jest/ESLint glob işleme araçları ve Expo config/Xcode proje işleme aracıdır; kullanıcı verisi işleyen uygulama runtime akışları değildir. npm'nin otomatik çözümü Expo SDK 57 ile uyumsuz React Native/Expo sürümlerine düşürmeyi önerdiği için `npm audit fix --force` uygulanmadı. Expo Doctor 20/20 ve resmi SDK sürüm eşleşmesi korunmuştur; Expo/Jest güvenli güncellemesi yayımlandığında yeniden taranmalıdır.

Hukuki site Next 16.2.6'dan güvenlik patch'i 16.2.12'ye yükseltildi. Kalan production uyarıları Next'in kendi PostCSS/Sharp sürüm aralıklarındadır; npm yalnız kırıcı Next downgrade'i önermektedir. Site yerel teslim edilmiştir ve güvenli upstream patch çıkmadan production alan adına açılmamalı ya da deploy anında yeniden değerlendirilmelidir.
