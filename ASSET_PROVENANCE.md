# Görsel Varlık Kaynağı ve Kullanım Notları

## Marka: Kurdele (güncel)

- Seçim: Kullanıcı 6 Ekim 2026'da 2 numaralı "Kurdele" ikon tasarımını onayladı.
- Kaynak dosyalar (yalnız tasarım referansı, uygulamaya bağlanmaz ve EAS arşivine girmez): `design-concepts/brand-ribbon-v1/icon-approved.png` (onaylı ikon), `logo-horizontal-reference.png` (yazılı logo referansı) ve `README.md` (istemler ve notlar).
- Yöntem: OpenAI yerleşik ImageGen aracı. Üçüncü taraf fotoğraf veya stok kurdele kullanılmadı; kurdele şekli onaylı ikondan alınmıştır ve değiştirilmemiştir.
- Renkler (onaylı ikondan ölçüldü): mercan `#E9596C` (README'deki `#E85D70` hedefine yakın), krem kurdele `#FCF1E4`; yazılı logoda derin erik `#59233D`.
- Şeffaf ana dosyalar: `assets/brand/ribbon-symbol-ivory.png` ve `ribbon-symbol-coral.png`. Onaylı ikonun zemini ve kurdelesi iki düz renk olduğundan her pikselin kurdele payı, zemin→kurdele renk doğrusuna izdüşümle hesaplandı; gürültü eşiklendi ve alanı 300 pikselden küçük yalıtılmış kalıntılar atıldı. Sonuç yalnızca ana düğüm ve iki kuyruktan oluşur, döngü delikleri şeffaftır. README'de reddedilen ImageGen şeffaf denemeleri kullanılmadı.
- Üretim: `node scripts/prepare-brand-assets.mjs` (bağımlılıksız, deterministik) şunları çıkarır: `assets/images/icon.png` (1024×1024, opak, köşeler önceden yuvarlatılmamış), `android-icon-foreground.png` ve `android-icon-monochrome.png` (108 dp tuvalde 66 dp güvenli daire içinde), `android-icon-background.png` (düz mercan), `splash-icon.png` (Android 12 açılış dairesi içinde), `favicon.png` (64×64), `notification-icon.png` (96×96, yalnız beyaz + şeffaflık) ve her iki şeffaf sembol dosyası.
- Yazılı logolar: `assets/brand/logo-horizontal.png` ve `logo-primary.png`, aynı betik tarafından `scripts/render-brand-logos.ps1` ile (Windows, GDI+) Georgia Bold ile dizilir. "Düğün Planım" yazısı üretilen resimden değil gerçek yazı tipinden gelir; Türkçe karakterler (ü, ğ, noktasız ı) doğrudur.
- Doğrulama: `npm run assets:check` boyutların yanı sıra köşelerin düz mercan olduğunu, adaptive ön planın güvenli daireyi aşmadığını, tek renkli ve bildirim ikonlarının yalnız beyaz olduğunu ve sembolde yalıtılmış kalıntı bulunmadığını piksel düzeyinde denetler.
- Altı tema paleti değişmez; marka ikonu bütün temalarda ortaktır.

## Eski sembol (yalnız eski mağaza varlıkları için)

- Dosya: `assets/brand/symbol-master.png` (kaynak: `symbol-chroma-source.png`). 30 Temmuz 2026'da OpenAI yerleşik ImageGen aracıyla bu projede üretilen önceki marka sembolüdür (bordo/şampanya altını).
- Uygulama ikonu, açılış ekranı, favicon, bildirim ikonu ve yazılı logolar artık bu sembolden üretilmez. `scripts/prepare_brand_assets.py` yalnızca henüz yeni markaya taşınmamış mağaza varlıklarını (Google Play ikonu, feature graphic, mağaza ekran görüntüsü çerçeveleri) bu eski sembolle üretir.
- Yeni markaya taşınması gereken eski kullanımlar: `assets/store/google-play-icon.png`, `assets/store/feature-graphic.png`, `assets/store/screenshot-background.png`, `store-listing/screenshots/**` (başlık şeridi ve sembol), `assets/store/legal-site-preview.png`, `legal-site/public/{favicon,icon,og}.png`.

## Hukuki site sosyal görseli

- Dosya: `legal-site/public/og.png`
- Yöntem: OpenAI yerleşik ImageGen aracıyla aynı marka paleti ve sembol dili için üretildi.
- Görseldeki metinler: “Düğün Planım” ve “Verileriniz cihazınızda kalır.”
- İnceleme: metinlerin Türkçe karakterleri, filigran bulunmaması ve mevcut marka kimliğiyle uyumu görsel olarak doğrulandı.

## Mağaza ekran görüntüleri

`store-listing/screenshots/*-source.png` dosyaları çalışan uygulamanın browser QA oturumundan alındı. `scripts/prepare_brand_assets.py` görünür gerçek UI alanını yeniden çizmeden ve oranını bozmadan markalı tuvallere yerleştirir; `scripts/validate-assets.mjs` resmi ölçü ve alfa kurallarını otomatik doğrular.

Üretilen varlıklar yalnız Düğün Planım ürünü için tasarlanmıştır. Nihai yayıncı, yayın öncesi marka tescil/benzerlik araştırması ve hedef ülke hukukunu ayrıca doğrulamalıdır; bu belge hukuki görüş değildir.

## Tema hero görselleri

- Dosyalar: `assets/themes/<tema-kimliği>-hero.png` (1536×1024 PNG, tema başına bir adet; altı tema). Kaynak PNG'ler korunur ve uygulama paketine girmez.
- Üretim tarihi: 5 Ekim 2026.
- Yöntem: OpenAI yerleşik ImageGen aracı. Altı görsel bu proje için sıfırdan üretildi.
- Hiçbir gerçek kişinin fotoğrafı veya kimliği referans olarak kullanılmadı. Görsellerdeki yetişkin çiftler kurgusal ve yapay olarak üretilmiştir.
- Görsellerde gömülü yazı, logo, marka veya filigran bulunmaz. Çift isimleri, sayaç ve tarih uygulamada gerçek metin olarak çizilir.
- Uygulama kopyaları: `assets/themes/optimized/<tema-kimliği>-hero.jpg` (1280×853) ve `…-thumb.jpg` (480×320, "Tarzını seç" kartları için); kaynak PNG'lerden yeniden boyutlandırılarak JPEG olarak üretildi. Uygulama yalnızca bu optimize türevleri kullanır.
- Görselleri uygulamaya bağlayan harita: `src/constants/theme-images.ts` (statik `require`). Görseller harici sunucudan yüklenmez ve kullanıcı verisi içermez.
- Yayın öncesi doğrulama: Nihai yayıncı, hedef ülke mevzuatına ve kullanılan üretim hizmetinin geçerli kullanım koşullarına uyumu doğrulamalıdır. Bu belge hukuki görüş değildir.
