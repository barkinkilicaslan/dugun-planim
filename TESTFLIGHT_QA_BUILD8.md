# TestFlight Build 8 — Güvenli iPhone Kontrolü

Bu kontrol listesi iOS `1.0.0 (8)` içindir. Amaç, gerçek iPhone'da son yayın düzeltmelerini ve temel akışları sınamak; düğün verilerinizi silmek veya değiştirmek değildir.

## Başlamadan önce

- TestFlight'ta **Düğün Planım 1.0.0 (8)** görünene kadar bekleyin ve uygulamayı güncelleyin.
- Uygulama içindeki mevcut isim, tarih, davetli veya tema bilgileri size ait ve önemliyse **“Tüm verilerimi sil”e dokunmayın** ve mevcut verilerinizin üstüne yedek geri yüklemeyin.
- İsterseniz önce Ayarlar'dan JSON yedeği dışa aktarın. Yedek şifrelenmez ve davetli adları, telefon/e-posta bilgileri, notlar ve bütçe içerebilir; yalnızca güvendiğiniz bir yerde saklayın.
- Gönderim ekranı açıldığında test sırasında mesajı göndermeyin; sadece ekranın açıldığını doğrulayıp kapatın.

## Kontrol sırası

| #   | Kontrol                                                   | Beklenen sonuç                                                                          | Sonuç / not |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| 1   | TestFlight sürümünü kontrol edin                          | `1.0.0 (8)` görünür ve uygulama açılır                                                  |             |
| 2   | Ana sayfayı ve seçili temayı kontrol edin                 | Düğün bilgileri, tema ve bütçe doğru kalır                                              |             |
| 3   | Ana sayfada bütçe kartlarına bakın                        | Tutarın sonu kesilmez; ör. `₺450.000,00` tam görünür                                    |             |
| 4   | Bütçe sekmesini ve bir kalemi açın                        | Toplam ve kalem tutarları tam görünür, beklenmedik biçimde değişmez                     |             |
| 5   | Uygulamayı tamamen kapatıp yeniden açın                   | Düğün bilgileri ve tema korunur; açılış ekranı uygulamayı takılı bırakmaz               |             |
| 6   | Ayarlar'daki yerel veri/yedek açıklamasını gözden geçirin | Verilerin uygulama alanında olduğu ve cihaz yedeklerine alınabileceği açıkça belirtilir |             |
| 7   | Test görevi oluşturup hatırlatma ayarlayın                | İzin varsa yerel hatırlatma planlanır; izin yoksa görev yönetimi çalışır                |             |
| 8   | Görevi düzenleyin veya silin                              | Hatırlatma güncellenir/iptal edilir; sorun olursa anlaşılır mesaj çıkar                 |             |
| 9   | Test davetlisi ekleyip RSVP durumunu değiştirin           | Katılıyor/Katılmıyor/Belki/Yanıt bekleniyor durumu kaydedilir                           |             |
| 10  | “Rehberden davetli ekle” akışını açın                     | Açıklama izin istemeden önce görünür; yalnız seçtiğiniz kişi eklenir                    |             |
| 11  | Davetiye önizleyip paylaşım ekranını açın                 | Önizleme doğru; iOS paylaşım/mesaj ekranı açılır; test mesajı gönderilmeden kapatılır   |             |
| 12  | JSON yedek, CSV ve PDF dışa aktarmayı deneyin             | Dosya oluşur, iOS paylaşım ekranı açılır ve dosya okunabilir                            |             |
| 13  | Salon/masa planı ile PDF özetini gözden geçirin           | Öğeler taşınabilir; PDF'de adlar ve yerleşim kesilmez                                   |             |
| 14  | Ayarlar'da dili Türkçe/English arasında değiştirin        | Başlıklar, düğmeler ve hata mesajları seçilen dilde görünür                             |             |

## Güvenli test sınırı

Mevcut verileriniz önemliyse yalnızca yeni, kolayca silinebilen test kayıtları kullanın. **“Tüm verilerimi sil” ve mevcut veriyi değiştirecek yedek geri yükleme bu kontrolde yapılmamalıdır.** Gerçek SMS/e-posta/WhatsApp daveti göndermek gerekmez.

## Rapor

Her madde için `Geçti`, `Sorun var` veya `Atlandı` yazın. Sorun varsa hangi ekranda olduğunu, beklenen ve görülen davranışı belirtin. Ekran görüntüsü ekleyecekseniz kişisel telefon, e-posta, adres veya gerçek davetli bilgilerini gizleyin.
