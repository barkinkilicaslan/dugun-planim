# Proje Durumu

Son güncelleme: 30 Temmuz 2026

| Faz                        | Durum                               | Tamamlanan                                                                              | Doğrulama / kalan                                                    |
| -------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 0 — Ortam ve kurallar      | Tamamlandı                          | Expo 57, Apple Xcode/iOS SDK ve Google API 36 resmi kontrolleri                         | `STORE_COMPLIANCE.md`; yükleme gününde yeniden kontrol               |
| 1 — Ürün ve bilgi mimarisi | Tamamlandı                          | Kapsam, akış, kabul ölçütleri, risk kararları                                           | `PRODUCT_SPEC.md`                                                    |
| 2 — Marka ve tasarım       | Tamamlandı                          | Özgün sembol, ikon/logo/splash, mağaza türevleri, tokenlar                              | Görsel inceleme + `ASSET_PROVENANCE.md`                              |
| 3 — Veri ve mimari         | Tamamlandı                          | SQLite şema/migration, repository, validation, transaction, i18n temeli                 | Migration/domain testleri PASS                                       |
| 4 — Ekran ve işlevler      | Tamamlandı                          | Onboarding, dashboard, tüm CRUD, filtreler, takvim, temalar                             | Browser E2E + component testleri PASS                                |
| 5 — Yedek/dışa aktarma     | Tamamlandı                          | JSON yedek, CSV, PDF, paylaşım, yerel bildirim                                          | Saf testler PASS; native share/notification cihaz testi bekliyor     |
| 6 — Erişilebilirlik        | Tamamlandı                          | 44px hedefler, safe-area, dinamik metin, semantik etiketler, responsive telefon/tablet  | Telefon/tablet web QA PASS; fiziksel cihaz bekliyor                  |
| 7 — Testler                | Tamamlandı (yerel)                  | Typecheck, lint, format, 23 Jest, Doctor 20/20, web export                              | Native cihaz matrisi release hesabı/buildi sonrası                   |
| 8 — Mağaza/hukuk           | Tamamlandı (yerel)                  | Gerçek UI görselleri, metinler, beyanlar, 5 rotalı site                                 | Gerçek domain/e-posta/hukuki bilgiler kullanıcıdan bekleniyor        |
| 9 — Build/teslim           | Yapılandırma tamam; artifact bloklu | `app.config.ts`, `eas.json`, Android native manifest doğrulaması, AAB profili, komutlar | EAS oturumu yok; hesap ve imzalama olmadan `.aab`/`.ipa` üretilemedi |

Tam kalite kanıtı [TEST_REPORT.md](./TEST_REPORT.md), kullanıcı girdileri [RELEASE_INPUTS.md](./RELEASE_INPUTS.md), yükleme akışı [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) içindedir.
