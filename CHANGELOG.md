# Değişiklik Günlüğü

## Yayınlanmamış (1.1.0 adayı)

- Türkçe ve İngilizce arayüz: Ayarlar → Dil (Otomatik/Türkçe/English), cihaz dil koduna göre otomatik seçim, yeniden başlatmadan değişim, dile göre tarih/saat/para biçimleri, iki dilde davetiye şablonları ve hazır mesajlar, yerelleştirilmiş izin metinleri.

- Düğün tarihi artık takvim seçicisiyle seçilir (GG.AA.YYYY, Türkçe uzun biçim); saat dilimi kaymasına karşı takvim tarihi olarak saklanır; yeni düğünde geçmiş tarih engellenir.
- Rehberden davetli ekleme (kullanıcı eyleminden sonra izin, çoklu seçim, telefon/e-posta seçimi, yinelenen denetimi/birleştirme).
- 10 davetiye şablonu, kaydet/düzenle/varsayılan, PNG ve PDF üretimi, isteğe bağlı fotoğraf.
- “Düğünümüz yetişkinlere özeldir” seçeneği (davetiye, PNG/PDF ve mesajlarda).
- E-posta, SMS, WhatsApp ve paylaşım menüsüyle kullanıcı onaylı sıralı gönderim.
- RSVP: Belki durumu, yanıt kaynağı/tarihi, gönderim durumu, sayaçlar ve filtreler. Çevrimiçi RSVP kapalı (karar: docs/ONLINE_RSVP_DECISION.md).
- SQLite şema sürümü 3 (geriye dönük uyumlu migration; yedek şeması 3).

## 1.0.0 — 1 Ağustos 2026

- Masalar, sahne, dans pisti, giriş, DJ ve ikram alanı için özelleştirilebilir salon planı eklendi.
- Sürükleme, adlandırma, boyutlandırma, 15° döndürme, yuvarlak/dikdörtgen masa ve konum kilidi eklendi.
- Salon planı SQLite/yedek şemasına, masa ekranı önizlemesine ve PDF çıktısına bağlandı.
- Salon planı migration, domain, component, erişilebilirlik ve tarayıcı kalıcılık kontrolleri eklendi.

## 1.0.0 — 30 Temmuz 2026

- Hesapsız, offline-first düğün planlama temeli.
- Görev, davetli, masa, bütçe, tedarikçi, takvim ve not yönetimi.
- Yerel hatırlatmalar, CSV/PDF dışa aktarma ve sürümlü yedekleme.
- Açık/koyu tema, erişilebilir telefon/tablet arayüzü.
- Tür güvenli Türkçe/İngilizce yerelleştirme temeli.
- App Store ve Google Play metinleri, gerçek UI tabanlı telefon/tablet görselleri.
- Gizlilik, koşullar, veri silme ve destek için yerel yayınlanabilir site.
