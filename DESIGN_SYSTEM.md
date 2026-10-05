# Düğün Planım — Tasarım Sistemi

Bu belge uygulamadan önce hazırlanmış, uygulanan görsel ve etkileşim kararlarının kaynağıdır.

## Tasarım yönü

Modern editorial düğün estetiği; sıcak, sakin ve güvenilir. Görsel dil literal kalp/yüzük/çiçek yerine takvim ritmi, dengeli boşluk ve güçlü tipografik hiyerarşi kullanır.

## Renk tokenları

| Rol           | Açık      | Koyu      |
| ------------- | --------- | --------- |
| Zemin         | `#F8F3EA` | `#181315` |
| Yüzey         | `#FFFDFC` | `#261F22` |
| Ana           | `#6F1D3A` | `#D78AA4` |
| Ana koyu      | `#521329` | `#F0B4C7` |
| Altın vurgu   | `#C7A86B` | `#D7BE8C` |
| Metin         | `#241E20` | `#F8F3EA` |
| İkincil metin | `#6F6468` | `#C9BDC1` |
| Kenar         | `#DED2C5` | `#453A3E` |
| Başarı        | `#356A50` | `#80C9A3` |
| Uyarı         | `#9A5B14` | `#F1BB72` |
| Hata          | `#A33838` | `#F09898` |

Renk tek başına anlam taşımaz; durumlar metin ve simgeyle tekrarlanır.

## Tipografi ve ölçüler

- Başlıklar: platform serif ailesi, 28/34 ve 22/28; editorial karakter.
- Gövde: sistem sans, 16/23; yardımcı metin 14/20; asgari 12/17.
- Dinamik yazı boyutuna izin verilir; kritik sayı kartları `maxFontSizeMultiplier=1.6` kullanır.
- 4 pt tabanlı aralık: `4, 8, 12, 16, 20, 24, 32, 40`.
- Kart köşesi 18 pt, giriş 14 pt, pill 999 pt. Ölçülü gölge yalnız yükseltilmiş kartlarda.

## Bileşenler

- `Screen`: safe-area, klavye kaçınma, telefon/tablet maksimum genişliği.
- `AppText`: başlık/gövde/yardımcı stiller ve tema renkleri.
- `Button`: primary/secondary/danger, en az 48 pt yükseklik.
- `TextField`: görünür etiket, hata metni, uygun klavye ve erişilebilirlik etiketi.
- `Card`, `MetricCard`, `Chip`, `EmptyState`, `SectionHeader`, `ProgressBar`.
- Basılabilir tüm satırlar en az 44×44 pt ve açık eylem etiketi taşır.

## Ekran akışı

```text
İlk Açılış → Kurulum 1/4 → 2/4 → 3/4 → İzin Açıklaması → Ana Sayfa
Ana Sayfa ─┬→ Hızlı Görev → Görev Düzenle
           ├→ Hızlı Davetli → Davetli Düzenle
           └→ Hızlı Harcama → Bütçe Kalemi Düzenle
Diğer ─────┬→ Masa Planı
           ├→ Tedarikçiler
           ├→ Takvim
           ├→ Notlar
           └→ Ayarlar → Yedekle / Geri Yükle / Tüm Verileri Sil
```

## Durumlar ve responsive davranış

- Boş durumda örnek veri taklidi yerine ilk yararlı eylem anlatılır.
- Veri yüklenirken merkezde marka renkli ilerleme ve açıklayıcı etiket görünür.
- Kurtarılabilir hata kartı tekrar deneme eylemi sunar.
- Tabletlerde içerik 920 pt ile sınırlanır; metrik kartları iki/üç sütuna yayılır.
- Formlar `KeyboardAvoidingView` ve kaydırma alanıyla klavye altında kalmaz.
- Yatay/dikey yön değişiminde kartlar sarılır; sabit piksel ekran genişliği kullanılmaz.
- Hareket azaltma tercihinde sürekli/tekrarlı animasyon yoktur; ilk sürümde zorunlu animasyon kullanılmaz.

## Tema sistemi (aşama 1)

Altı tarz (`romantic-garden`, `mediterranean-dream`, `modern-elegance`, `bohemian-sunset`, `midnight-glamour`, `wildflower-meadow`) `src/constants/themes.ts` içindeki merkezi token'larla tanımlanır; ekranlar `useAppTheme()` ile okur, sabit renk yazılmaz.

- Token grupları: renkler (yüzey, metin, kenar, durum, ikon kutusu, ilerleme, alt menü, hero), tipografi (başlık/gövde, etiket aralığı), şekil (kart/kontrol köşesi, ikon kutusu, fotoğraf alanı, ilerleme biçimi, gölge) ve `layout` varyantları (hero, metrik, hızlı işlem) ile dekoratif motif türü.
- Ana sayfa tek ekrandır; hero alanı tema başına bir fotoğraf (`src/constants/theme-images.ts`) ve soldan sağa solan bir okunabilirlik katmanı (`heroScrim`) kullanır; fotoğrafın üstündeki metin gerçek metindir. Kompozisyon `src/components/home` içindeki ortak bileşenlerde tema varyantıyla değişir. Dekoratif motifler saf `View` ile çizilir; fotoğraflar pakete dahil yerel dosyalardır, harici görsel yoktur.
- Tercih `expo-sqlite/kv-store` içinde saklanır (yedeğe girmez, tüm veri silinince sıfırlanır). İlk açılışta tarz yoksa `/style-select` gösterilir.
- Gece Işıltısı tek koyu temadır. Eski `profile.theme` (açık/koyu/sistem) alanı veritabanında ve yedekte geriye uyumluluk için durur, arayüzde kullanılmaz.
- Kontrast: her tema için metin/yüzey çiftleri testlerle en az 4.5:1 doğrulanır (`__tests__/themes.test.ts`).
