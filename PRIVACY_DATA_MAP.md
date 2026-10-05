# Gizlilik ve Veri Akışı Haritası

Son doğrulama: 1 Ağustos 2026.

| Veri                                            | Amaç                             | Saklama                                                              | Ağ aktarımı                                   | Silme                             |
| ----------------------------------------------- | -------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| Çift isimleri, düğün tarihi                     | Kişiselleştirme/geri sayım       | SQLite, cihaz içi                                                    | Yok                                           | Ayarlar → Tüm verileri sil        |
| Bütçe ve ödemeler                               | Planlama                         | SQLite, cihaz içi                                                    | Yok                                           | Tekil silme veya tüm veri         |
| Davetli adı/telefon/not                         | Davetli yönetimi                 | SQLite, cihaz içi                                                    | Yok                                           | Tekil silme veya tüm veri         |
| Görev, tedarikçi, not, masa                     | Planlama                         | SQLite, cihaz içi                                                    | Yok                                           | Tekil silme veya tüm veri         |
| Salon düzeni ve konumları                       | Mekân/masa yerleşimi             | SQLite, cihaz içi                                                    | Yok                                           | Çizimden silme veya tüm veri      |
| Rehberden seçilen kişi (ad, telefon, e-posta)   | Davetli ekleme                   | SQLite, cihaz içi; yalnız kullanıcının seçtiği kişiler               | Yok                                           | Tekil silme veya tüm veri         |
| Davetli RSVP durumu, gönderim durumu/kanalı     | Katılım takibi                   | SQLite, cihaz içi                                                    | Yok                                           | Tekil silme veya tüm veri         |
| Davetiye tasarımları ve fotoğrafı               | Davetiye                         | SQLite + uygulama klasörü (fotoğraf), cihaz içi                      | Yok                                           | Tasarım silme veya tüm veri       |
| Çocuksuz düğün tercihi ve mesajı                | Davetiye/mesaj metni             | SQLite, cihaz içi                                                    | Yok                                           | Tüm veri silme                    |
| Davetiye PNG/PDF (geçici)                       | Paylaşım                         | Önbellek; sonraki üretim/uygulama açılışında silinir                 | Yalnız kullanıcı seçtiği hedefe               | Otomatik temizlik                 |
| Uygulama dili tercihi (Otomatik/Türkçe/English) | Arayüz dili                      | `expo-sqlite/kv-store` (web: localStorage), cihaz içi; yedeğe girmez | Yok                                           | Uygulamayı kaldırma               |
| Tema ve plan tercihleri                         | Uygulama tercihi                 | SQLite, cihaz içi                                                    | Yok                                           | Tüm veri silme                    |
| Bildirim izin kararı                            | Tekrar izin istememe/yerel ayar  | SecureStore                                                          | Yok                                           | Tüm veri silme                    |
| Yedek/CSV/PDF                                   | Kullanıcının dışa aktarma isteği | Kullanıcının seçtiği/paylaştığı konum                                | Yalnız OS paylaşım hedefini kullanıcı seçerse | Kullanıcı dosya sisteminden siler |

## İzinler

- **Bildirim:** Sadece fayda açıklandıktan ve kullanıcı “İzin ver” dediğinde istenir. Ret temel işlevleri etkilemez. Yerel görev hatırlatmaları içindir.
- **Dosya seçici:** Yalnız “Yedeği geri yükle” veya “CSV içe aktar” eyleminde sistem belge seçici açılır.
- **Paylaşım:** Yalnız kullanıcının dışa aktarma/PDF eyleminde işletim sistemi paylaşım sayfası açılır.
- **Rehber:** yalnız “Rehberden davetli ekle” eyleminde ve açıklama ekranından sonra istenir. iOS 18 sınırlı erişimi desteklenir. Android'de yalnız `READ_CONTACTS` vardır (`WRITE_CONTACTS` kaldırıldı). Rehber yalnız bellekte listelenir; kullanıcı seçmedikçe kaydedilmez, loglanmaz, gönderilmez. Gmail/Outlook bulut rehberi (OAuth) desteklenmez.
- **E-posta/SMS/WhatsApp/paylaşım:** davetiye metni (ve e-postada PNG eki) yalnız kullanıcı gönder düğmesine basınca işletim sisteminin ekranına verilir; son onay kullanıcıdadır. Sonuç doğrulanamazsa kayıt “Gönderim ekranı açıldı” olur.
- **Davetiye fotoğrafı:** sistem dosya seçicisiyle seçilir (fotoğraf izni yok) ve uygulama klasörüne kopyalanır. JSON yedeğe **dahil edilmez**; yedek alınmadan önce ve geri yüklemeden sonra kullanıcıya bildirilir, geri yüklenen tasarımlarda fotoğraf alanı boş olur. Kaydedilmeyen yeni fotoğraflar düzenleyiciden çıkınca ve uygulama açılışında temizlenir.
- **Kendi davetiyeni yükle:** JPG/PNG görsel sistem fotoğraf seçicisiyle (iOS PHPicker; izin penceresi gerekmez) veya dosya seçiciyle seçilir ve yalnız uygulama klasörüne (`personal-invitations/`) kopyalanır; SQLite `personal_invitations` tablosunda yalnız ad, dosya yolu ve boyut tutulur. Sunucuya gönderilmez, JSON yedeğe **dahil edilmez** (yedek öncesi bildirilir). Paylaşım/e-posta için dosya önbelleğe kopyalanır ve yalnız kullanıcı düğmeye bastığında işletim sisteminin paylaşım/e-posta ekranı açılır; uygulama hiçbir mesajı kendisi göndermez. Aynı cihazda geri yüklemede korunur, "Tüm verilerimi sil" ile silinir. `NSPhotoLibraryUsageDescription` TR/EN yerelleştirilmiştir.
- Konum, kamera, mikrofon, reklam kimliği veya izleme izni istenmez; fotoğraf arşivinin tamamı okunmaz.
- **Çevrimiçi RSVP kapalıdır.** Açılırsa “veriler yalnız cihazda kalır” ifadesi geçersiz olur; belge, gizlilik politikası ve mağaza beyanları güncellenmeden etkinleştirilmemelidir.

## SDK incelemesi

Expo/React Native çalışma zamanı ile Router, SQLite, SecureStore, Notifications, FileSystem, DocumentPicker, Sharing, Print, Localization, Crypto, Constants, System UI ve Application modülleri kullanılır. Reklam, analiz, çökme raporlama, sosyal giriş veya üçüncü taraf izleme SDK’sı yoktur. Paket amaçları README’de listelenmiştir.

Loglara kullanıcı metni, telefon veya finansal değer yazılmaz. Uygulama işletilen bir backend’e sahip değildir.
