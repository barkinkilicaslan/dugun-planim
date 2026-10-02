# Düğün Planım — Ürün Tanımı

## Vizyon

Düğün Planım, nişanlı çiftlerin hazırlıklarını tek cihazda, hesap açmadan ve internete ihtiyaç duymadan yönetmesini sağlayan Türkçe bir planlama uygulamasıdır. Başarı ölçütü; çiftin görev, davetli, masa, bütçe, tedarikçi, ödeme, takvim ve not durumunu güvenle anlayıp güncelleyebilmesidir.

## İlk sürüm kapsamı

- Dört adımlı kurulum: çift isimleri, tarih, bütçe, davetli hedefi, para birimi ve açıklama sonrası isteğe bağlı bildirim izni.
- Ana panel: geri sayım, hazırlık ilerlemesi, görev/davetli/bütçe özeti ve yaklaşan işler.
- Görev, davetli, masa, bütçe/ödeme, tedarikçi ve not CRUD akışları.
- Masaları, sahneyi, dans pistini, girişi, DJ ve ikram alanını sürükleyip boyutlandırmaya, döndürmeye ve kilitlemeye yarayan özelleştirilebilir salon planı.
- Arama ve anlamlı filtreler; hazır görev başlangıç listesi.
- Görev ve ödeme tarihlerini birleştiren takvim/liste görünümü.
- CSV içe/dışa aktarma, PDF özetleri, sürümlü JSON yedekleme ve doğrulamalı geri yükleme.
- Açık/koyu/sistem tema; değiştirilebilir para ve tarih formatı.
- Yerel bildirimler yalnız açık kullanıcı eylemi ve sistem izni ile.
- Yerel verileri çift onayla tamamen silme.

## Kapsam dışı kararlar

- Hesap, backend, bulut eşitleme, reklam, abonelik, analiz ve izleme SDK’sı yoktur.
- Rehber erişimi yalnızca kullanıcı “Rehberden davetli ekle” dediğinde, açıklama ekranından sonra istenir; yalnız seçilen kişiler kaydedilir. Gmail/Outlook bulut rehberi (OAuth) kapsam dışıdır.
- Sözleşme eki saklama ilk sürümde yoktur; dosya yaşam döngüsü ve hassas belge kapsamı gereksiz risk yaratır.
- Uygulama profesyonel düğün, hukuk veya finans danışmanlığı sağlamaz.

## Bilgi mimarisi

Alt menü: **Ana Sayfa · Görevler · Davetliler · Bütçe · Diğer**.

Diğer bölümü: **Masa Planı · Tedarikçiler · Takvim · Notlar · Ayarlar**.

Detay ve düzenleme ekranları kök yığında açılır; geri hareketi platform davranışını korur. Kurulum tamamlanmadan ana yığın gösterilmez.

## Temel kabul ölçütleri

1. Veriler uygulama yeniden açıldığında korunur ve hiçbir dış sunucuya gönderilmez.
2. Tamamlanan görev yüzdesi ve bütçe değerleri her ekranda aynı domain hesaplarından gelir.
3. Masa ataması kapasiteyi aşamaz; davetli kişi sayısı yetişkin/çocuk alanlarından tutarlı hesaplanır.
4. Salon planındaki her masa mevcut bir masa kaydına bağlıdır; konum, boyut, açı, şekil ve kilit durumu yeniden açılışta korunur.
5. Bozuk veya desteklenmeyen yedek mevcut veriye dokunmadan reddedilir.
6. İzin reddi hiçbir temel akışı engellemez.
7. Silme işlemleri kullanıcı onayı ister; tüm veri silme iki ayrı onay gerektirir.
