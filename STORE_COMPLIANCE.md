# Mağaza Uyumluluğu — 30 Temmuz 2026

Resmi kaynaklar teslim tarihinde yeniden kontrol edildi. Bu belge hukuki danışmanlık değildir; Console metni ve ülke kapsamı yükleme gününde tekrar doğrulanmalıdır.

## Platform tabanı

- Expo SDK 57 resmi sürüm sayfası React Native 0.86, React 19.2.3, minimum Node 22.13, Android compile/target API 36 ve iOS minimum 16.4 tabanını belirtir: https://docs.expo.dev/versions/v57.0.0/
- Apple, 28 Nisan 2026'dan itibaren App Store yüklemelerinin Xcode 26 veya sonrası ve iOS/iPadOS 26 SDK ile oluşturulmasını ister: https://developer.apple.com/news/upcoming-requirements/?id=02032026a
- Google Play, 31 Ağustos 2026'dan itibaren yeni uygulama/güncellemelerde Android 16 / API 36 hedefini ister: https://developer.android.com/google/play/requirements/target-sdk
- Proje Expo SDK 57 ve production AAB profiliyle bu tabanlara yapılandırılmıştır. Nihai Xcode/Gradle sürümü EAS build logunda doğrulanmalıdır.

## Apple

- Privacy manifest kaynak ve required-reason API beyanları: https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk
- `NSPrivacyTracking=false`, tracking domain yok ve uygulamanın kendi veri toplama beyanı boş yapılandırıldı. Expo paket manifestlerinin merge sonucu production archive içindeki `PrivacyInfo.xcprivacy` ile tekrar denetlenmelidir.
- Uygulama ikonu 1024×1024, RGB ve transparan değildir.
- Ekran görüntüsü resmi referansı: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Üretilen iPhone görselleri kabul edilen 1290×2796; iPad görselleri 2048×2732 portre ölçüsündedir. Her set dört görseldir ve alfa içermez.
- Yaş derecelendirme zorunluluğu ve tanımları: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/
- Şifreleme: özel şifreleme yok; `ITSAppUsesNonExemptEncryption=false`. Nihai ihracat cevapları dağıtım ülkeleriyle birlikte gözden geçirilir.

## Google Play

- Mağaza görsel gereksinimleri: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- İkon 512×512 RGBA; feature graphic 1024×500 RGB; telefon ve tablet PNG'leri resmi min/maks oran ve boyutları içindedir.
- Data Safety resmi rehberi: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Uygulama geliştirici sunucusuna veri göndermez; Data Safety taslağı “toplanmıyor/paylaşılmıyor”dur. Gizlilik politikası URL'si yine de zorunludur.
- Hesap silme şartı rehberi: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-EN
- Bu sürüm hesap oluşturmadığı için web tabanlı hesap silme akışı uygulanmaz; uygulama içi tüm yerel veri silme bulunur.
- Yerel prebuild manifestinde yalnız normal `INTERNET`/`VIBRATE` kalır; legacy READ/WRITE storage ve development `SYSTEM_ALERT_WINDOW` izinleri `tools:node="remove"` ile engellenmiştir. AAB birleşik manifesti production build sonrası yeniden kontrol edilir.

## Yayıncı ve ülke bilgileri

Türkiye/AB dahil hedef pazarlara göre yayıncı adı, hukuki adres, destek e-postası, telefon ve AB trader statüsü kullanıcı tarafından doldurulmalıdır. Eksikler [RELEASE_INPUTS.md](./RELEASE_INPUTS.md) içindedir.
