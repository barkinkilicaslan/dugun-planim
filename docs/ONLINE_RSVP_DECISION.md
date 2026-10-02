# Çevrimiçi RSVP — Backend Karar Raporu

Durum: **karar bekliyor.** Hiçbir sağlayıcı hesabı, proje, veritabanı veya canlı servis oluşturulmadı. Uygulamada `FEATURES.onlineRsvp = false`; `RsvpProvider` arayüzü (`src/domain/rsvp-provider.ts`) ve devre dışı sağlayıcı hazırdır. Kapalıyken hiçbir RSVP bağlantısı üretilmez; davetiye ve mesajlarda yalnız “son cevap tarihi” metni yer alır.

## Mevcut altyapı (gerçek durum)

- Hukuk/destek sitesi **GitHub Pages** üzerinde yayınlanıyor: `https://barkinkilicaslan.github.io/dugun-planim/`. Statik bir sitedir; veri toplamaz ve sunucu tarafı mantığı çalıştırmaz.
- **Cloudflare hesabı, Worker veya D1 veritabanı oluşturulmadı.** Depodaki `legal-site/worker` klasörü şablondan kalan bir dosyadır; canlıda kullanılan bir altyapı değildir ve bu karar için bir dayanak sayılmamalıdır.
- Şu an hiçbir backend yoktur ve bu rapor kapsamında oluşturulmadı.

## Neden backend gerekir?

Davetlinin telefonundaki bir web formundan organizatör cihazına yanıt gelmesi için herkese açık bir form ve yanıtları geçici tutan bir sunucu şarttır. Bu, “hesap/backend yok, veriler yalnız cihazda” iddiasını bozar. Bu yüzden özellik varsayılan olarak kapalıdır ve yerel RSVP (elle durum, sayaçlar, filtreler) bağımsız çalışır.

## Seçenek A — Supabase (Postgres + Edge Functions)

|          |                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kurulum  | Proje + tablo + Row Level Security + Edge Function; herkese açık form için anonim erişim kuralları gerekir.                                                                                    |
| Maliyet  | Ücretsiz katman var, ancak ücretsiz projelerin hareketsizlikte duraklatılması gibi sınırlar olabilir; canlıya almadan önce güncel plan/limitler kontrol edilmelidir.                           |
| Gizlilik | Veri bölgesi seçilebilir (AB). Geniş yönetim yüzeyi (Auth, Storage, Realtime) gereksiz saldırı yüzeyi ve yanlış RLS yapılandırması riski getirir.                                              |
| Bakım    | Yönetilen Postgres, yedekleme ve SQL arayüzü rahat; fakat RLS politikaları, anahtar yönetimi ve sürüm güncellemeleri sürekli dikkat ister. Anonim form için `anon` anahtarı istemciye gömülür. |
| Uygunluk | Bu proje için gereğinden büyük (ihtiyaç: tek form, birkaç tablo).                                                                                                                              |

## Seçenek B — Cloudflare Worker + D1

|          |                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kurulum  | Ayrı bir Cloudflare hesabı, bir Worker (form + küçük JSON API), D1 veritabanı ve Rate Limiting kuralı oluşturmak ve dağıtmak gerekir. Bunların **hiçbiri şu an yoktur**.      |
| Maliyet  | Ücretsiz katman bu ölçek (aile/davetli başına birkaç yanıt) için genellikle yeterlidir; canlıya almadan önce güncel limitler kontrol edilmelidir.                             |
| Gizlilik | Yalnız yazdığımız uç noktalar vardır; istemciye gömülü genel veritabanı anahtarı yoktur. Veri minimizasyonu ve TTL kodla doğrudan uygulanır.                                  |
| Bakım    | Küçük kod tabanı, SQL şeması 2–3 tablo; sunucu tarafı mantığı (token, TTL, rate limit) bizim kontrolümüzde. Kendi kodumuz olduğu için test ve güvenlik incelemesi gerektirir. |
| Uygunluk | En küçük yüzey; “hesapsız” ilkesine en yakın model.                                                                                                                           |

## Öneri

**Seçenek B (Cloudflare Worker + D1).** Gerekçe: yüzey çok dar, kullanıcı hesabı yok, kamuya açık veritabanı anahtarı yok, TTL/rate limit/silme kodla açıkça yönetilir. Bunun için yeni bir Cloudflare hesabı ve ayrı bir dağıtım gerekir; mevcut hukuk sitesi altyapısından yararlanılmaz. Supabase yalnız ileride hesap, bildirim veya gerçek zamanlı özellikler gerekirse mantıklı olur.

## Güvenli tasarım taslağı (onay sonrası uygulanacak)

- **Davet jetonu:** davetli başına 128 bit rastgele (`crypto.getRandomValues`), URL-güvenli; sunucuda yalnız SHA-256 özeti saklanır. Tahmin edilemez; sıralı kimlik yok.
- **Süre sınırı:** jeton, son cevap tarihi + 14 gün sonra geçersiz; tüm kayıtlar düğün tarihinden 30 gün sonra otomatik silinir.
- **Rate limiting:** IP başına ve jeton başına istek sınırı; hatalı jeton denemelerinde artan gecikme; form gönderiminde basit bot önlemi (CAPTCHA zorunluluğu olmadan, süre/honeypot).
- **Veri minimizasyonu:** sunucuya yalnız jeton özeti, yanıt durumu, yetişkin/çocuk sayısı, isteğe bağlı kısa not ve zaman damgası gider. Davetli adı, telefon, e-posta ve rehber verisi **sunucuya gönderilmez**; form sayfası ad göstermek zorundaysa yalnız organizatörün seçtiği görünen etiketle sınırlı kalır.
- **Çocuksuz düğün:** form, ayara göre çocuk alanını gizler veya devre dışı bırakır; sunucu da çocuk sayısını reddeder.
- **Organizatör senkronizasyonu:** cihazda üretilen rastgele organizatör anahtarı SecureStore'da tutulur, sunucuda özeti saklanır; uygulama `fetchResponses(since)` ile yanıtları çeker ve `applyOnlineRsvp` ile işler. Elle yapılan değişiklik her zaman önceliklidir.
- **Silme:** `revokeAll()` ve “Tüm verilerimi sil” çevrimiçi kayıtları da siler; ayrı bir “çevrimiçi RSVP'yi kapat ve sil” eylemi eklenir.
- **Şeffaflık:** özellik açılırken ayrı bir onay ekranı hangi verinin sunucuya gittiğini açıkça gösterir.

## Etkinleştirmeden önce zorunlu güncellemeler

1. `legal-site` gizlilik politikası, veri saklama/silme sayfası ve kullanım koşulları.
2. `PRIVACY_DATA_MAP.md` ve README'deki “veriler yalnızca cihazda kalır” ifadeleri (sınırlandırılacak veya kaldırılacak).
3. `store-listing/declarations.md`: App Store Privacy (Contact Info yok; “Other User Content / Usage” gibi kategoriler yeniden değerlendirilecek) ve Google Data Safety (toplanan/paylaşılan veri; aktarımda şifreleme; silme talebi) taslakları.
4. Mağaza açıklama metinleri.

**Karar için sizden istenen:** sağlayıcı seçimi (öneri: B), kullanılacak alan adı ve hesap sahibi. Onay gelmeden hesap/proje/veritabanı oluşturulmaz.
