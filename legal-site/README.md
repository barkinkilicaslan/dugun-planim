# Düğün Planım Hukuki ve Destek Sitesi

Mobil uyumlu ve erişilebilir gizlilik, koşullar, veri saklama/silme ve destek sayfaları. Site hesap, veritabanı veya kullanıcı verisi kullanmaz.

## Yerel kullanım

```powershell
npm install
npm run dev
npm run lint
npm test
```

`npm test` production build oluşturur ve beş rotanın HTML çıktısını doğrular.

## Tek noktadan yapılandırma

`site-config.ts` şu ortam değişkenlerini okur:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_PUBLISHER_NAME`

Alan adı verilmediği için teslim yereldir. Yayın öncesi gerçek alan adı, destek adresi, yayıncı/hukuki kişi ve hedef ülke gereksinimleri kullanıcı tarafından doğrulanmalıdır. İçerik taslaktır; hukuk danışmanlığı değildir.

## Rotalar

- `/` — gizlilik ve destek merkezi
- `/privacy` — Gizlilik Politikası
- `/terms` — Kullanım Koşulları
- `/data-retention` — Veri Saklama ve Silme
- `/support` — Destek ve SSS

`.openai/hosting.json` Sites uyumluluğu için korunur; D1/R2 bağlaması yoktur.
