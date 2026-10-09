# Release Checklist — 1.0.0 (iOS build 7 planned)

Son güncelleme: 9 Ekim 2026. EAS’ta 1.0.0 (6) TestFlight’a yüklendi; bu çalışma alanındaki yeni düzeltmeler build 6’da yok. Sıradaki iOS paketi build 7 olmalı. App Review’a gönderim veya mağaza yayını yapılmadı. İşaretli maddeler doğrulanmış durumları, açık maddeler cihaz, mağaza formu veya insan incelemesi gerektirenleri gösterir.

## Kod ve kalite

- [x] Expo SDK 57 / React Native 0.86 / TypeScript strict
- [x] Typecheck, lint ve formatter kontrolü
- [x] Birim, component, migration, onboarding, yedek ve silme testleri (46 suite, 635 test)
- [x] Expo Doctor 20/20
- [x] Web production export
- [x] Hukuki site statik build ve rota testleri (30/30; son yerel değişiklikler henüz yayımlanmadı)
- [x] Gerçek çalışan web uygulamasında onboarding, persistence ve CRUD smoke testi
- [x] Özelleştirilebilir salon planında hızlı yerleşim, özellik düzenleme, kilitleme, önizleme ve yeniden açılış kalıcılık testi
- [ ] Fiziksel Android telefon/tablet smoke testi
- [ ] Fiziksel iPhone/iPad smoke testi
- [ ] Native bildirim, dosya seçici, paylaşım ve PDF smoke testi
- [ ] Fiziksel cihazlarda salon öğelerini sürükleme ve salon planlı PDF smoke testi

## Kimlik ve kullanıcı girdileri

- [ ] `com.barkin.dugunplanim` Google Play'de benzersiz mi doğrula; gerekirse `EXPO_PUBLIC_PACKAGE_ID` ile mağaza kaydı açılmadan önce değiştir
- [x] Aynı bundle ID'yi Apple Developer/App Store Connect'te kaydet (`com.barkin.dugunplanim`; App ID `6818340839`)
- [ ] Apple SKU oluştur
- [ ] Yayıncı adı, hukuki kişi/adres, telefon ve AB trader statüsünü doldur
- [x] Gerçek destek e-postasını `appsupportline@gmail.com` olarak yapılandır
- [x] Hukuki site GitHub Pages'te mevcut; yeni veri-yedeği açıklamalarının yayımı bekliyor
- [ ] Hedef ülkeleri ve yerel tüketici/mahremiyet gereksinimlerini hukuk danışmanıyla doğrula

## Gizlilik ve içerik

- [x] Hesap, backend, reklam, analiz ve tracking SDK'sı yok
- [x] App Privacy ve Data Safety taslakları gerçek veri akışıyla eşleştirildi
- [x] Uygulama içi iki aşamalı tüm veri silme mevcut
- [x] Bildirim izni onboarding açıklamasından sonra ve isteğe bağlı
- [x] İkonlar, screenshotlar, feature graphic ve kaynak kayıtları hazır
- [ ] EAS iOS archive içindeki birleştirilmiş `PrivacyInfo.xcprivacy` ve üçüncü taraf SDK manifest/imzalarını doğrula
- [ ] EAS Android AAB manifestinde yalnız beklenen izinleri doğrula
- [ ] App Store yaş derecelendirme ve Google IARC sonuçlarını taslak cevaplarla karşılaştır
- [x] Gerçek URL yayımlandıktan sonra uygulama, mağaza ve site linklerinde kırık bağlantı kontrolü yap

## EAS ve imzalama

1. Kullanıcı kendi hesabında çalıştırır:

   ```powershell
   npx eas-cli@latest login
   npx eas-cli@latest whoami
   npx eas-cli@latest build:configure
   ```

2. Android production AAB:

   ```powershell
   npx eas-cli@latest build --platform android --profile production
   ```

   - [ ] EAS'in yönettiği yeni Android keystore'u oluştur veya mevcut upload key'i güvenli şekilde seç
   - [ ] Build logunda compile/target API 36 ve release variant doğrula
   - [ ] `.aab` dosyasını indir; paket adı, versionCode `1` ve imzayı kontrol et
   - [ ] AAB içinde source map, `.env`, test fixture veya debug-only varlık olmadığını `eas build:inspect`/bundle analiziyle kontrol et

3. iOS production archive:

   ```powershell
   npx eas-cli@latest build --platform ios --profile production
   ```

   - [x] Apple Developer hesabına EAS üzerinden giriş yap
   - [x] Distribution certificate ve App Store provisioning profile seç/oluştur
   - [ ] Build logunda Xcode 26.4+ ve iOS 26 SDK doğrula
   - [ ] IPA/archive içinde bundle ID, build `1`, ikon, privacy manifest ve imzayı kontrol et

İmzalama anahtarları, `.p8`, `.p12`, `.mobileprovision`, keystore ve mağaza parolaları Git'e eklenmez.

## Mağaza yükleme

### Google Play

- [ ] Yeni uygulama ve paket adı kaydı
- [ ] App signing kurulumu
- [ ] AAB internal testing track'e taslak olarak yükle
- [ ] Store listing metinleri, ikon, feature graphic, 4 telefon ve 4 tablet screenshot yükle
- [ ] Data Safety, reklam, hedef kitle, uygulama erişimi ve IARC formlarını doldur
- [ ] Internal test; pre-launch report; kapalı/açık test gereksinimini Console hesabına göre tamamla
- [ ] Production rollout öncesi ülke, fiyatlandırma ve iletişim/trader bilgilerini doğrula

Komut:

```powershell
npx eas-cli@latest submit --platform android --profile production
```

`eas.json` gönderimi güvenli varsayılan olarak `internal` + `draft` yapılandırır.

### App Store Connect

- [x] App kaydı ve bundle ID
- [ ] Türkçe metadata, privacy URL, destek/pazarlama URL'si
- [ ] 4 iPhone ve 4 iPad screenshot
- [ ] App Privacy, yaş derecelendirmesi, ihracat uyumluluğu, trader ve inceleme iletişimi
- [ ] IPA'yı TestFlight'a yükle; processing ve export compliance sonucunu kontrol et
- [ ] TestFlight internal smoke testi ve App Review notları

Son TestFlight paketi 9 Ekim 2026 tarihinde oluşturuldu ve App Store Connect'e yüklendi:

- EAS build: `0160523f-166b-4020-b65e-51de75e1ec2f`
- EAS submission: `f98f120a-8ca5-47aa-893d-64cea57e0f87`
- App Store Connect app ID: `6818340839`
- Sürüm/build: `1.0.0 (6)`
- Apple'ın işleme ve TestFlight'ta kurulum durumu ayrıca doğrulanmalı.

Komut:

```powershell
npx eas-cli@latest submit --platform ios --profile production
```

## Nihai insan kontrolü

- [ ] Hukuk metinleri hukuk danışmanı tarafından gözden geçirildi
- [ ] Yayıncı bilgileri ve hedef ülke gereksinimleri doğrulandı
- [ ] Destek gelen kutusu çalışıyor ve izleniyor
- [ ] Store metinlerinde uygulanmamış özellik iddiası yok
- [ ] Production binary gerçek cihazlarda açılıyor; veriler kapanıp açılınca korunuyor
- [ ] Bildirim reddi, uçak modu, yedek/geri yükleme ve tüm veri silme gerçek cihazda tekrar sınandı
