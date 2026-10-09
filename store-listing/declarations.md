# Mağaza Beyan Taslakları

Bu cevaplar 30 Temmuz 2026 tarihindeki uygulama davranışı içindir. Console formları yayımdan hemen önce yeniden okunmalıdır.

## Apple App Privacy

- Tracking: `Hayır`
- Kullanıcıyla ilişkilendirilen veri: `Toplanmıyor`
- Kullanıcıyla ilişkilendirilmeyen veri: `Toplanmıyor`
- Geliştirici veya üçüncü taraf sunucuya aktarılan veri: `Yok`
- Kullanıcının kendi seçtiği hedefe JSON/CSV/PDF paylaşması: uygulama geliştiricisi tarafından “collection” değildir; hedef servis kendi politikasına tabidir.

## Apple yaş derecelendirmesi taslağı

Tüm içerik açıklama sıklıkları `None`: şiddet, korku, cinsel içerik/çıplaklık, kaba dil, alkol/tütün/uyuşturucu, kumar, yarışma, sağlık/tedavi, sınırsız web erişimi ve kullanıcılar arası iletişim yoktur. Kullanıcıların kendi cihazında tuttuğu özel notlar diğer kullanıcılara yayınlanmaz. Beklenen sonuç en düşük yaş kategorisidir; App Store Connect'in hesapladığı sonuç esas alınır.

## Apple ihracat uyumluluğu

Uygulama özel veya standart dışı şifreleme uygulamaz. Sistem/Expo çalışma zamanının işletim sistemi güvenliği dışında şifreleme özelliği sunulmaz. `ITSAppUsesNonExemptEncryption=false` yapılandırılmıştır. App Store Connect soruları nihai binary ve dağıtım ülkelerine göre kullanıcı tarafından tekrar yanıtlanmalıdır.

## Google Play Data Safety

- Veri toplanıyor: `Hayır`
- Veri paylaşılıyor: `Hayır`
- Geçici işlenen ağ verisi: `Yok`
- Hesap oluşturma: `Yok`
- Kullanıcı veri silme talebi: `Uygulama içinde Ayarlar → Tüm verilerimi sil (iki onay); hesap silme URL'si uygulanmaz.` Silinenler: yerel veritabanı, bu cihaza yüklenen davetiye görselleri ve fotoğrafları, planlı hatırlatmalar, uygulamanın önbellekteki geçici dışa aktarma dosyaları ve görsel tarz tercihi. Kullanıcının daha önce paylaştığı yedek/CSV/PDF kopyaları kullanıcının seçtiği konumda kalır. Bir kalıntı silinemezse kullanıcıya bildirilir ve açılışta yeniden denenir.
- Yedek ve cihaz yedekleri: JSON yedek şifrelenmez ve kişisel veri içerir (kullanıcıya yedek öncesi söylenir). Uygulama verisi işletim sistemi cihaz yedeğinden (iCloud/Android Otomatik Yedekleme) hariç tutulmamıştır; bu, geliştiriciye veri aktarımı sayılmaz. Dosya/fotoğraf seçicinin yazdığı geçici kopyaları işletim sistemi yönetir ve "Tüm verilerimi sil" bunları kapsamaz. Yayından önce hukuk/yayıncı onayıyla gizlilik politikasına eklenmelidir.
- Güvenlik uygulamaları: kullanıcı verisi geliştirici sunucusuna aktarılmadığından aktarımda şifreleme sorusu uygulanmaz; dışa aktarılan hedefi kullanıcı seçer.

## Google içerik derecelendirmesi taslağı

Şiddet, cinsellik, kaba dil, kontrollü madde, kumar, kullanıcı etkileşimi, konum paylaşımı ve satın alma yoktur. Uygulama kullanıcı tarafından girilen kişisel planlama verisini cihaz dışında yayınlamaz. Beklenen sonuç düşük/genel yaş kategorisidir; IARC form sonucunun nihai cevabı esas alınır.

## İzin uyumu

- Bildirim: yalnız açık seçimle yerel görev hatırlatması.
- Belge seçici: JSON yedek veya CSV içe aktarma seçildiğinde.
- Paylaşım/yazdırma: JSON, CSV veya PDF dışa aktarma seçildiğinde.
- Kişiler (iOS `NSContactsUsageDescription`, Android `READ_CONTACTS`): yalnız “Rehberden davetli ekle” eylemiyle, Türkçe açıklama ekranından sonra. Yalnız kullanıcının seçtiği kişiler cihazdaki veritabanına yazılır; sunucuya gönderilmez. `WRITE_CONTACTS` kaldırılmıştır.
- E-posta, SMS, WhatsApp, paylaşım: kullanıcı eylemiyle işletim sistemi ekranı açılır; uygulama sessiz gönderim yapmaz.
- Davetiye tasarımı fotoğrafı: sistem dosya seçicisi (Dosyalar/Fotoğraflar uygulaması üzerinden seçilen tek dosya); bu akış için fotoğraf kitaplığı izni istenmez. Fotoğraflar JSON yedeğe dahil edilmez (kullanıcıya bildirilir).
- Kendi davetiyeni yükle: JPG/PNG sistem fotoğraf seçicisi (iOS PHPicker) veya dosya seçicisiyle seçilir, yalnız cihazdaki uygulama klasörüne kopyalanır; sunucuya gönderilmez, JSON yedeğe dahil edilmez. `NSPhotoLibraryUsageDescription` Türkçe/İngilizce yerelleştirilmiştir.
- Fotoğraf erişimi (tek tutarlı beyan): uygulama fotoğraf kitaplığını **okumaz**; yalnız kullanıcının sistem seçicisinde seçtiği tek görseli uygulama klasörüne kopyalar. iOS'ta bu seçici PHPicker'dır ve Expo belgelerine göre görsel seçmek için ayrı izin penceresi gerekmez (cihazda TestFlight ile doğrulanmalıdır). `Info.plist` içinde yine de TR/EN `NSPhotoLibraryUsageDescription` açıklaması bulunur ("yalnızca seçtiğiniz davetiye görselini uygulamaya kopyalamak için"); sistem bir izin isterse bu metin gösterilir. Android'de `READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` engellenmiştir (sistem fotoğraf seçicisi kullanılır).
- İstenmeyen izinler: konum, kamera, mikrofon ve reklam kimliği yoktur; fotoğraf arşivinin tamamı okunmaz.

## Taslak güncellemesi (rehber ve davetiye gönderimi)

- Apple App Privacy: **Contacts** verisi uygulama tarafından toplanmaz (cihaz dışına çıkmaz). Davetiye metni/PNG/PDF yalnız kullanıcı seçtiği iletişim uygulamasına devredilir. Çevrimiçi RSVP etkinleştirilirse bu bölüm yeniden yazılmalıdır (bkz. docs/ONLINE_RSVP_DECISION.md).
- Google Data Safety: “Kişi bilgileri” toplanmıyor/paylaşılmıyor (işlem yalnız cihazda). Çevrimiçi RSVP açılırsa ad, yanıt ve not “toplanan veri” olur ve bu bölüm değişmelidir.
