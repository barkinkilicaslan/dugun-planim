# Görsel Varlık Kaynağı ve Kullanım Notları

## Ana sembol

- Dosya: `assets/brand/symbol-master.png`
- Tarih: 30 Temmuz 2026
- Yöntem: OpenAI yerleşik ImageGen aracıyla bu proje için sıfırdan üretildi.
- Nihai prompt özeti: takvim, planlama ritmi ve birlikteliği soyutlayan; bordo/şampanya altını; kalp, yüzük, yazı, filigran ve marka taklidi içermeyen minimal sembol.
- Kaynak: `symbol-chroma-source.png`; düz kromaki zemin resmi skill yardımcısıyla alfa kanalına dönüştürüldü.
- İnceleme: anlamsız yazı/filigran yok; küçük ölçekte kaybolacak ince çizgi yok; açık/koyu arka planda güçlü siluet; özgünlük kısıtları sağlandı.

## Türetilen varlıklar

`scripts/prepare_brand_assets.py` onaylı sembolden uygulama ikonu, adaptive icon katmanları, splash, favicon, bildirim ikonu, ana/yatay logo, feature graphic ve dekoratif arka planları tekrar üretilebilir biçimde çıkarır. iOS 1024×1024 ikonu opak fildişi zemindedir. Adaptive foreground, orta güvenli bölgede tutulur.

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
