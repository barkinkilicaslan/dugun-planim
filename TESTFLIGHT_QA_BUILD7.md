# TestFlight Build 7 — Güvenli Cihaz Kontrolü

Bu kontrol listesi iOS `1.0.0 (7)` içindir. Amacı gerçek cihazdaki davranışı doğrulamak; mevcut düğün verilerinizi silmek veya değiştirmek değildir.

## Başlamadan önce

- TestFlight'ta **Düğün Planım 1.0.0 (7)** sürümünü yükleyin.
- Uygulama içindeki mevcut isim, tarih, davetli veya tema bilgileri size ait ve önemliyse **“Tüm verilerimi sil”e dokunmayın** ve mevcut verilerinizin üstüne yedek geri yüklemeyin.
- İsterseniz önce Ayarlar'dan JSON yedeği dışa aktarın. Yedek şifrelenmez ve davetli adları, telefon/e-posta bilgileri, notlar ve bütçe içerebilir; yalnızca güvendiğiniz bir yerde saklayın.
- Gönderim ekranı açıldığında test sırasında mesajı göndermeyin; sadece ekranın açıldığını doğrulayıp kapatın.

## Kontrol sırası

| #   | Kontrol                                                          | Beklenen sonuç                                                                        | Sonuç / not |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- |
| 1   | TestFlight sürümünü kontrol edin                                 | `1.0.0 (7)` görünür ve uygulama açılır                                                |             |
| 2   | Mevcut ana sayfayı ve temayı kontrol edin                        | Düğün bilgileri, tema ve bütçe doğru kalır                                            |             |
| 3   | Uygulamayı tamamen kapatıp yeniden açın                          | Düğün bilgileri ve tema korunur; açılış ekranı takılma yapmaz                         |             |
| 4   | Bütçeyi düzenleyin: `450000` girip kaydedin                      | Türkçe sayı girişi/tutarı doğru; kaydetme sonrası değer bozulmaz                      |             |
| 5   | Tek bir test görevi oluşturup hatırlatma ayarlayın               | İzin verilmişse yerel hatırlatma planlanır; izin yoksa temel görev yönetimi çalışır   |             |
| 6   | Görevi düzenleyin veya silin                                     | Hatırlatma güncellenir/iptal edilir; hata olursa anlaşılır mesaj çıkar                |             |
| 7   | Test davetlisi ekleyip RSVP durumunu değiştirin                  | Katılıyor/Katılmıyor/Belki/Yanıt bekleniyor durumu kaydedilir                         |             |
| 8   | “Rehberden davetli ekle” akışını açın                            | Açıklama izin istemeden önce görünür; yalnızca seçtiğiniz kişi eklenir                |             |
| 9   | Davetiye önizleyin ve paylaşım ekranını açın                     | Önizleme doğru; iOS paylaşım/mesaj ekranı açılır; test mesajı gönderilmeden kapatılır |             |
| 10  | Kendi davetiye görseliniz varsa yükleyip uygulamayı yeniden açın | Görsel cihazda korunur; uygulama yanıtı veya beklenmedik izin penceresi göstermez     |             |
| 11  | Yedek/CSV/PDF dışa aktarmayı deneyin                             | Dosya oluşur ve iOS paylaşım ekranı açılır; dosya içeriği okunur                      |             |
| 12  | Salon planı ve masa planı PDF'sini gözden geçirin                | Öğeler ekranda hareket ettirilebilir; PDF'de adlar ve yerleşim kesilmez               |             |
| 13  | Ayarlar'da dili Türkçe/English arasında değiştirin               | Başlıklar, düğmeler ve hata mesajları seçilen dilde görünür                           |             |

## Güvenli test sınırı

Mevcut verileriniz önemliyse 5–12. maddelerde yalnızca yeni, kolayca silinebilen test kayıtları kullanın. **“Tüm verilerimi sil” ve mevcut veriyi değiştirecek yedek geri yükleme bu kontrolde yapılmamalıdır.** Bir test için gerçek bir SMS/e-posta/WhatsApp daveti göndermek gerekmez.

## Bana raporlamak için

Her madde için `Geçti`, `Sorun var` veya `Atlandı` yazın. Sorun varsa hangi ekranda olduğunu, beklediğiniz davranışı ve gördüğünüz davranışı belirtin; ekran görüntüsü yalnız kişisel telefon, e-posta, adres veya gerçek davetli bilgisi içermiyorsa ekleyin.
