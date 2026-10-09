# Mağaza Materyalleri

## Görseller

- App Store iPhone: `screenshots/phone-*.png` — 1290×2796, RGB, alfa yok
- App Store iPad 13 inç: `screenshots/tablet-*.png` — 2048×2732, RGB, alfa yok
- Google Play telefon/tablet: aynı gerçek UI tabanlı PNG'ler
- Google Play ikon: `../assets/store/google-play-icon.png` — 512×512 RGBA
- Google Play feature graphic: `../assets/store/feature-graphic.png` — 1024×500 RGB
- Apple uygulama ikonu: `../assets/images/icon.png` — 1024×1024 RGB, alfa yok

`*-source.png` dosyaları çalışan Expo web uygulamasından tarayıcı QA sırasında alınan ekranlardır. Son görseller `scripts/prepare_brand_assets.py` ile bu kaynaklar esnetilmeden markalı, resmi boyutlu tuvale yerleştirilir.

App Store için yerelleştirilmiş setler (her biri 6 ekran, aynı sıra: Ana sayfa, Görevler, Davetliler ve RSVP, Davetiye şablonları, Mekân ve masa planı, Bütçe):

- `screenshots/tr/iPhone/`, `screenshots/tr/iPad/`
- `screenshots/en-US/iPhone/`, `screenshots/en-US/iPad/`

Bu setler Ekim 2026'da güncel tema ve kurdele markasını içeren Expo web export'undan, kurgusal örnek verilerle yeniden alınmıştır; üstüne metin/çerçeve eklenmemiştir. iOS build 8 ile görsel karşılaştırma ve mağazaya yüklemeden önce son onay bekleniyor. Eski `phone-*`/`tablet-*` görselleri Google Play için tutuluyor ve yeni arayüze göre güncellenmeleri gerekiyor.

## Metinler ve beyanlar

- `app-store-tr.md`
- `app-store-en-US.md` (`npm run metadata:check` ile sınırlar doğrulanır)
- `google-play-tr.md`
- `declarations.md`

URL, e-posta, yayıncı adı ve hukuki kimlik yer tutucuları yüklemeden önce [RELEASE_INPUTS.md](../RELEASE_INPUTS.md) ile değiştirilmelidir. App Review telefon alanı bilinçli olarak `{{APP_REVIEW_PHONE}}` bırakılmıştır.
