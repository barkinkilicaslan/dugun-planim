# Mimari

## Katmanlar

```text
Expo Router ekranları
    ↓
UI bileşenleri + AppContext (uygulama durumu)
    ↓
Domain modelleri / doğrulama / hesaplamalar
    ↓
Repository sözleşmesi
    └── Expo SQLite: native WAL + transaction + migration; web WASM önizleme
    ↓
Platform servisleri: SecureStore, Notifications, FileSystem, Sharing, Print
```

UI içinde para, tarih, kapasite veya bütçe hesabı yapılmaz. `src/domain` saf ve birim testli; `src/services` izin ve platform davranışını kapsüller.

## Veri modeli

- `profile`: tek satır düğün ve tercih bilgileri.
- `tasks`: kategori, başlık, açıklama, son tarih, öncelik, durum, bildirim kimliği.
- `guests`: taraf, grup, kişi/çocuk sayısı, RSVP, yemek/alerji, masa ilişkisi.
- `tables`: ad ve kapasite.
- `budget_items`: kategori, planlanan/gerçekleşen/ödenen tutarlar, vade, tedarikçi ilişkisi.
- `vendors`: kategori, iletişim, teklif, sözleşme durumu ve notlar.
- `notes`: başlık, içerik, güncellenme zamanı.
- `meta`: şema sürümü ve uygulama içi teknik anahtarlar.

Tutarlar kayan nokta hatasını önlemek için kuruş/cents cinsinden tamsayı tutulur. Tarihler gün bazlı değerlerde `YYYY-MM-DD`, olay zamanlarında ISO-8601 olarak saklanır.

## Migration ve bütünlük

Migration’lar sıralı, tek transaction içinde ve tekrar çalıştırılabilir şekilde uygulanır. Native yazımlar transaction ile yapılır. Yabancı anahtarlar açıktır; kullanıcı girdisi parametre bağlama ile sorgulanır. `schemaVersion=1` ilk sürümdür.

## Yedekleme

JSON zarfı: `format`, `schemaVersion`, `appVersion`, `exportedAt`, `payload`. Geri yükleme önce boyut/sözdizimi/şema/entity doğrulaması yapar, sonra tek repository değişimiyle uygular. Mevcut veri doğrulama başarıyla bitmeden silinmez.

## Yerelleştirme

Gezinme metinleri `src/i18n/index.ts` içindeki tür güvenli Türkçe ve İngilizce kataloglarından okunur. Eksik/desteklenmeyen locale Türkçeye düşer; ürün metinlerinin kalanını aynı anahtar yapısına taşımak yeni dil ekleme sürecinin kontrollü devam adımıdır. Tarih ve para platform `Intl` API’siyle locale/currency tercihine göre biçimlenir.
