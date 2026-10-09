# TestFlight Build 9 — Görev önerileri ve güvenli güncelleme kontrolü

Bu kontrol listesi iOS `1.0.0 (9)` içindir. Mevcut düğün verilerini silmeden başlangıç görevlerinin temizlenmesini ve yeni görev önerilerini doğrular.

## Başlamadan önce

- TestFlight'ta **Düğün Planım 1.0.0 (9)** görünene kadar bekleyin ve uygulamayı güncelleyin.
- **“Tüm verilerimi sil”e dokunmayın** ve mevcut verinin üstüne yedek geri yüklemeyin.
- Mevcut görevlerde kendi eklediğiniz/geçmiş tarihli işler varsa ekran görüntüsü veya kısa not alın; görevleri silmeyin.

## Kontrol sırası

| #   | Kontrol                                                    | Beklenen sonuç                                                                                                                   | Sonuç / not |
| --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| 1   | Sürüm bilgisini kontrol edin                               | `1.0.0 (9)` görünür; uygulama açılır                                                                                             |             |
| 2   | Ana sayfa, davetliler, bütçe ve seçili temayı kontrol edin | Mevcut kişisel bilgiler değişmeden korunur                                                                                       |             |
| 3   | Görevler listesini açın                                    | Eski başlangıç görevlerinden otomatik eklenmiş ve hiç değiştirilmemiş gecikmiş görevler temizlenir; kişisel görevleriniz korunur |             |
| 4   | Görevler ekranında **Görev önerileri**ne dokunun           | Öneriler aranabilir ve kategorilere ayrılmış görünür                                                                             |             |
| 5   | Bir öneriyi planınıza ekleyin                              | Görev kaydolur, tarih belirleyene kadar gecikmiş görünmez                                                                        |             |
| 6   | Uygulamayı kapatıp yeniden açın                            | Eklediğiniz öneri ve mevcut düğün verileri korunur                                                                               |             |
| 7   | Uygulama dilini English yapıp öneri ekranını açın          | Ekran metinleri ve yeni öneriler İngilizce görünür; daha önce kaydedilmiş kişisel metinler çevrilmez                             |             |
| 8   | Kişisel olarak oluşturduğunuz eski görevleri kontrol edin  | Tamamlanan, düzenlenen veya hatırlatıcılı görevler yerinde kalır                                                                 |             |

## Rapor

Her madde için `Geçti`, `Sorun var` veya `Atlandı` yazın. Kendi görevlerinizden biri kaybolursa uygulamayı kapatıp açmadan önce haber verin. Ekran görüntüsü paylaşacaksanız telefon, e-posta, adres veya davetli bilgilerini gizleyin.
