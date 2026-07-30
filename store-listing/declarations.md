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
- Kullanıcı veri silme talebi: `Uygulama içinde Ayarlar → Tüm verilerimi sil; hesap silme URL'si uygulanmaz.`
- Güvenlik uygulamaları: kullanıcı verisi geliştirici sunucusuna aktarılmadığından aktarımda şifreleme sorusu uygulanmaz; dışa aktarılan hedefi kullanıcı seçer.

## Google içerik derecelendirmesi taslağı

Şiddet, cinsellik, kaba dil, kontrollü madde, kumar, kullanıcı etkileşimi, konum paylaşımı ve satın alma yoktur. Uygulama kullanıcı tarafından girilen kişisel planlama verisini cihaz dışında yayınlamaz. Beklenen sonuç düşük/genel yaş kategorisidir; IARC form sonucunun nihai cevabı esas alınır.

## İzin uyumu

- Bildirim: yalnız açık seçimle yerel görev hatırlatması.
- Belge seçici: JSON yedek veya CSV içe aktarma seçildiğinde.
- Paylaşım/yazdırma: JSON, CSV veya PDF dışa aktarma seçildiğinde.
- İstenmeyen izinler: kişi rehberi, konum, kamera, mikrofon, fotoğraf arşivi ve reklam kimliği yoktur.
