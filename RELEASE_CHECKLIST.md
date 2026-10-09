# Release Checklist — 1.0.0 (iOS build 9 uploaded to App Store Connect)

Son güncelleme: 10 Ekim 2026. Build 9 App Store Connect’e başarıyla yüklendi; EAS submission `64949362-dffe-4c8e-8c09-af49c05c4382` tamamlandı. Apple’ın işleme/TestFlight'ta görünme durumu ve bu cihazda kurulum henüz doğrulanmadı. App Review'a gönderim veya mağaza yayını yapılmadı. İşaretli maddeler doğrulanmış durumları, açık maddeler cihaz, mağaza formu veya insan incelemesi gerektirenleri gösterir.

## Kod ve kalite

- [x] Expo SDK 57 / React Native 0.86 / TypeScript strict
- [x] Typecheck, lint ve formatter kontrolü
- [x] Birim, component, migration, onboarding, yedek ve silme testleri (48 suite, 642 test)
- [x] GitHub Quality workflow (commit `b489e59`, success)
- [x] Web production export
- [x] Hukuki site statik build ve rota testleri (30/30; ilgili değişiklikler GitHub Pages'e dağıtıldı)
- [x] Gerçek çalışan web uygulamasında onboarding, persistence ve CRUD smoke testi
- [x] Telefon genişliği web önizlemesinde ana sayfa/bütçe uzun tutarları kesilmeden gösteriyor; gerçek iPhone'da yeni build ile tekrar doğrulanmalı
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
- [x] Hukuki site GitHub Pages'te mevcut; cihaz yedekleri ve dosya seçici kopyalarıyla ilgili açıklamalar yayımlandı
- [ ] Hedef ülkeleri ve yerel tüketici/mahremiyet gereksinimlerini hukuk danışmanıyla doğrula

## Gizlilik ve içerik

- [x] Hesap, backend, reklam, analiz ve tracking SDK'sı yok
- [x] App Privacy ve Data Safety taslakları gerçek veri akışıyla eşleştirildi
- [x] Uygulama içi iki aşamalı tüm veri silme mevcut
- [x] Bildirim izni onboarding açıklamasından sonra ve isteğe bağlı
- [x] Uygulama ikonları ve feature graphic boyut/içerik doğrulamasından geçti
- [x] Türkçe/İngilizce iPhone ve iPad mağaza görsellerini güncel tema/kurdele arayüzüyle yerelde yenile (Expo web export, kurgusal veriler)
- [ ] Build 9'daki görev önerileri ekranını da içerecek şekilde mağaza ekran görüntülerini güncelle; iPhone/iPad görüntülerini build 9 ile karşılaştırıp onayla
- [x] Build 7 IPA arşivindeki uygulama ve üçüncü taraf SDK gizlilik manifestlerini, gerekli API reason kodlarını ve imza/profile dosyalarının varlığını doğrula (13 manifest; hepsinde tracking=false ve toplanan veri yok; Apple build'i TestFlight için geçerli kabul etti)
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
   - [x] Build 7 EAS/Xcode günlüğünde Xcode 26.6 ve iOS 26.5 SDK doğrulandı
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
- [ ] 6 iPhone ve 6 iPad ekran görüntüsünü TestFlight build 9 ile karşılaştırıp App Store Connect'e yükle
- [ ] App Privacy, yaş derecelendirmesi, ihracat uyumluluğu, trader ve inceleme iletişimi
- [x] Build 9'u TestFlight için App Store Connect'e yükle (EAS submission finished; Apple processing pending verification)
- [ ] Build 9'u TestFlight internal tester grubundan iPhone'a kur ve cihaz testini tamamla
- [ ] TestFlight internal smoke testi ve App Review notları

Build 9 için mevcut verileri silmeden uygulanacak cihaz test sırası: [TESTFLIGHT_QA_BUILD9.md](./TESTFLIGHT_QA_BUILD9.md).

Son App Store Connect okuması (`eas metadata:pull`, 9 Ekim 2026): sürüm kaydında yalnızca Türkçe uygulama adı vardı; İngilizce mağaza yerelleştirmesi, alt başlık, açıklama ve gizlilik URL'si yoktu. Türkçe/İngilizce mağaza metni yerel [store.config.json](./store.config.json) dosyasında hazırlandı; kaynak Markdown alanlarıyla birebir eşleşti ve `eas metadata:lint` geçti. **App Store Connect'e gönderilmedi.** Build 9 metinleri içeren yerel taslak 10 Ekim'de güncellendi ve `automaticRelease: false` olarak ayarlandı; Apple'a henüz gönderilmedi. Son ASC okumasında otomatik yayın açıktı. İnceleme iletişim telefonu kaynak taslağında hâlâ yer tutucudur. Hukuki sayfalardaki yedekleme açıklamaları 6df3e86 ile yayımlandı; hukuk danışmanının nihai incelemesi hâlâ gerekli.

Apple'ın güncel şartı, iPhone Dynamic Island orta boyutlu ekran için en az bir; iPadOS destekleniyorsa 13 inç iPad için en az bir ekran görüntüsüdür. Mevcut PNG boyutları (iPhone 1290×2796, iPad 2048×2732) kabul edilen ölçüler arasında; içerik/marka güncelliği ise yukarıdaki maddede yeniden doğrulanmalı. Kaynak: [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications).

Son TestFlight paketi 10 Ekim 2026 tarihinde oluşturuldu ve App Store Connect'e yüklendi. EAS yüklemeyi doğruladı; Apple işlemesi/TestFlight'ta görünme durumu kontrol edilmeli:

- EAS build: `389fdf3d-7e48-42b8-be2a-8b0cdb7df2e7`
- EAS submission: `64949362-dffe-4c8e-8c09-af49c05c4382`
- App Store Connect app ID: `6818340839`
- Sürüm/build: `1.0.0 (9)`
- Kaynak commit: `b489e59939e74fd3ffb836fa340f23d56ce795e4`
- EAS yüklemesi başarılı; Apple işlemesi ve gerçek iPhone kurulumu henüz doğrulanmadı.

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
