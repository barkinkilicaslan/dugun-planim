import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

import { createTranslator } from '@/i18n';

/**
 * Uygulamanın kendi dışa aktarma dosyaları (JSON yedek, CSV, PDF) için geçici dosya yönetimi.
 *
 * Paylaşım için üretilen her dosya `Paths.cache/dugun-planim-exports/<zaman damgası>/<dosya adı>` altına yazılır. Dizin
 * adındaki 13 haneli zaman damgası hem dosyaya temiz bir ad bırakır hem de yaşını dosya sistemi API'lerine (ve onların
 * birim farklarına) güvenmeden bilmemizi sağlar. Temizlik yalnız bu dizinde, adı bu desene uyan girdileri ve eski
 * sürümlerin bilinen dosya adlarını siler; başka uygulama veya sistem dosyalarına, kullanıcının paylaştığı kopyalara
 * dokunmaz.
 */

export interface CleanupResult {
  removed: number;
  failed: number;
}

const EXPORT_DIR = 'dugun-planim-exports';
const STAMP = /^\d{13}$/;
/** Uygulama öne geldiğinde bu süreden eski dışa aktarma dosyaları silinir (Android paylaşım hedefleri dosyayı geç okuyabilir). */
export const EXPORT_MAX_AGE_MS = 60 * 60 * 1000;
/** Yeni bir dışa aktarma başlarken yalnız bundan eski önceki dışa aktarmalar silinir (paylaşım hedefi hâlâ okuyor olabilir). */
export const EXPORT_PREVIOUS_MAX_AGE_MS = 5 * 60 * 1000;

export function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '-');
  // Yalnız noktalardan oluşan (".", "..") veya boş ad üst dizine çözümlenmesin.
  return cleaned === '' || /^\.+$/.test(cleaned) ? 'export' : cleaned;
}

const none = (): CleanupResult => ({ removed: 0, failed: 0 });
const merge = (a: CleanupResult, b: CleanupResult): CleanupResult => ({
  removed: a.removed + b.removed,
  failed: a.failed + b.failed,
});

function exportsDirectory(): Directory {
  return new Directory(Paths.cache, EXPORT_DIR);
}

/** Yeni bir dışa aktarma dosyası için (henüz oluşturulmamış) `File` döndürür; üst dizin hazırlanır. */
export function createExportFile(filename: string, now = Date.now()): File {
  const folder = new Directory(exportsDirectory(), String(now));
  folder.create({ intermediates: true, idempotent: true });
  return new File(folder, safeFilename(filename));
}

/**
 * Paylaşım hiç başlamadıysa (paylaşım kullanılamıyor veya hata verdi) dosyayı ve zaman damgası dizinini hemen siler.
 * Paylaşım penceresi kullanıcı tarafından kapatıldığında çağrılmaz: iptal ile başarılı paylaşım her platformda ayırt
 * edilemez ve paylaşım hedefi dosyayı hâlâ okuyor olabilir; o durumda süreye dayalı temizlik geçerlidir.
 */
export function discardExportFile(file: File): void {
  try {
    const folder = file.parentDirectory;
    if (STAMP.test(folder.name)) folder.delete();
    else if (file.exists) file.delete();
  } catch {
    // Kalıntı bir sonraki dışa aktarmada, uygulama açılışında ve "Tüm verilerimi sil" ile temizlenir.
  }
}

/**
 * Zaman damgası dizinlerini siler. `maxAgeMs` 0 ise (varsayılan) tüm uygulama dışa aktarma dosyaları silinir.
 * Dizin adı desene uymayan girdilere dokunulmaz. Hata atmaz; sonucu sayılarla bildirir.
 */
export function purgeExportFiles(maxAgeMs = 0, now = Date.now()): CleanupResult {
  if (Platform.OS === 'web') return none();
  const result = none();
  try {
    const directory = exportsDirectory();
    if (!directory.exists) return result;
    for (const entry of directory.list()) {
      if (!(entry instanceof Directory) || !STAMP.test(entry.name)) continue;
      // Saat geri alınmışsa (gelecekteki damga) dizin de eski sayılır ve silinir.
      const age = now - Number(entry.name);
      if (age >= 0 && age < maxAgeMs) continue;
      try {
        entry.delete();
        result.removed += 1;
      } catch {
        result.failed += 1;
      }
    }
  } catch {
    result.failed += 1;
  }
  return result;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Eski sürümlerin doğrudan önbelleğe yazdığı dosyaların (her iki dilde) tam adları. */
export function legacyExportMatchers(): RegExp[] {
  const matchers: RegExp[] = [];
  for (const locale of ['tr', 'en'] as const) {
    const t = createTranslator(locale);
    for (const name of [t('budget.csvFile'), t('guests.csvFile'), t('budget.pdfFile'), t('tables.pdfFile')])
      matchers.push(new RegExp(`^${escapeRegExp(safeFilename(name))}$`));
    const backup = safeFilename(t('settings.backupFile', { date: '0000-00-00' }));
    matchers.push(new RegExp(`^${escapeRegExp(backup).replace('0000-00-00', '\\d{4}-\\d{2}-\\d{2}')}$`));
  }
  return matchers;
}

/**
 * Eski sürümlerden kalan dosyaları siler: önbellek kökündeki, adı uygulamanın bilinen dışa aktarma adlarıyla birebir
 * eşleşen dosyalar ve `expo-print`'in yalnız bu uygulama için ürettiği `Print/*.pdf` dosyaları.
 */
export function purgeLegacyExportFiles(): CleanupResult {
  if (Platform.OS === 'web') return none();
  const result = none();
  const matchers = legacyExportMatchers();
  const remove = (file: File) => {
    try {
      file.delete();
      result.removed += 1;
    } catch {
      result.failed += 1;
    }
  };
  try {
    for (const entry of Paths.cache.list())
      if (entry instanceof File && matchers.some((matcher) => matcher.test(entry.name))) remove(entry);
  } catch {
    result.failed += 1;
  }
  try {
    const printDirectory = new Directory(Paths.cache, 'Print');
    if (printDirectory.exists)
      for (const entry of printDirectory.list()) if (entry instanceof File && /\.pdf$/i.test(entry.name)) remove(entry);
  } catch {
    result.failed += 1;
  }
  return result;
}

/** "Tüm verilerimi sil": tüm dışa aktarma dosyaları (güncel dizin dahil) ve eski sürümlerin kalıntıları. */
export function removeAllExportFiles(): CleanupResult {
  if (Platform.OS === 'web') return none();
  let result = none();
  try {
    const directory = exportsDirectory();
    if (directory.exists) {
      const before = directory.list().length;
      directory.delete();
      result.removed += before;
    }
  } catch {
    result.failed += 1;
  }
  result = merge(result, purgeLegacyExportFiles());
  return result;
}
