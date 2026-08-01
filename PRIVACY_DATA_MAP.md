# Gizlilik ve Veri Akışı Haritası

Son doğrulama: 1 Ağustos 2026.

| Veri                        | Amaç                             | Saklama                               | Ağ aktarımı                                   | Silme                             |
| --------------------------- | -------------------------------- | ------------------------------------- | --------------------------------------------- | --------------------------------- |
| Çift isimleri, düğün tarihi | Kişiselleştirme/geri sayım       | SQLite, cihaz içi                     | Yok                                           | Ayarlar → Tüm verileri sil        |
| Bütçe ve ödemeler           | Planlama                         | SQLite, cihaz içi                     | Yok                                           | Tekil silme veya tüm veri         |
| Davetli adı/telefon/not     | Davetli yönetimi                 | SQLite, cihaz içi                     | Yok                                           | Tekil silme veya tüm veri         |
| Görev, tedarikçi, not, masa | Planlama                         | SQLite, cihaz içi                     | Yok                                           | Tekil silme veya tüm veri         |
| Salon düzeni ve konumları   | Mekân/masa yerleşimi             | SQLite, cihaz içi                     | Yok                                           | Çizimden silme veya tüm veri      |
| Tema ve plan tercihleri     | Uygulama tercihi                 | SQLite, cihaz içi                     | Yok                                           | Tüm veri silme                    |
| Bildirim izin kararı        | Tekrar izin istememe/yerel ayar  | SecureStore                           | Yok                                           | Tüm veri silme                    |
| Yedek/CSV/PDF               | Kullanıcının dışa aktarma isteği | Kullanıcının seçtiği/paylaştığı konum | Yalnız OS paylaşım hedefini kullanıcı seçerse | Kullanıcı dosya sisteminden siler |

## İzinler

- **Bildirim:** Sadece fayda açıklandıktan ve kullanıcı “İzin ver” dediğinde istenir. Ret temel işlevleri etkilemez. Yerel görev hatırlatmaları içindir.
- **Dosya seçici:** Yalnız “Yedeği geri yükle” veya “CSV içe aktar” eyleminde sistem belge seçici açılır.
- **Paylaşım:** Yalnız kullanıcının dışa aktarma/PDF eyleminde işletim sistemi paylaşım sayfası açılır.
- Rehber, konum, kamera, mikrofon, fotoğraf kitaplığı, reklam kimliği veya izleme izni istenmez.

## SDK incelemesi

Expo/React Native çalışma zamanı ile Router, SQLite, SecureStore, Notifications, FileSystem, DocumentPicker, Sharing, Print, Localization, Crypto, Constants, System UI ve Application modülleri kullanılır. Reklam, analiz, çökme raporlama, sosyal giriş veya üçüncü taraf izleme SDK’sı yoktur. Paket amaçları README’de listelenmiştir.

Loglara kullanıcı metni, telefon veya finansal değer yazılmaz. Uygulama işletilen bir backend’e sahip değildir.
