import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  createExportFile,
  discardExportFile,
  EXPORT_PREVIOUS_MAX_AGE_MS,
  purgeExportFiles,
  safeFilename,
} from '@/services/export-files';
import { getActiveLocale, t } from '@/i18n';

function downloadOnWeb(filename: string, contents: string, mimeType: string): void {
  if (typeof document === 'undefined') throw new Error(t('export.browserUnavailable'));
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareTextFile(filename: string, contents: string, mimeType: string): Promise<void> {
  const safeName = safeFilename(filename);
  if (Platform.OS === 'web') {
    downloadOnWeb(safeName, contents, mimeType);
    return;
  }
  // Önceki (5 dakikadan eski) dışa aktarma dosyaları silinir; yeni dosya yalnız uygulamanın kendi önbellek dizinine yazılır.
  purgeExportFiles(EXPORT_PREVIOUS_MAX_AGE_MS);
  const file = createExportFile(safeName);
  file.create({ overwrite: true, intermediates: true });
  try {
    file.write(contents);
    if (!(await Sharing.isAvailableAsync())) throw new Error(t('share.unavailable'));
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: t('export.shareTitle') });
  } catch (error) {
    // Paylaşım açılamadıysa kişisel veri içeren dosya süre dolmasını beklemeden silinir.
    discardExportFile(file);
    throw error;
  }
}

export async function shareHtmlAsPdf(filename: string, html: string): Promise<void> {
  if (Platform.OS === 'web') {
    const popup = window.open('', '_blank');
    if (!popup) throw new Error(t('export.popupBlocked'));
    popup.document.write(html);
    popup.document.close();
    popup.print();
    return;
  }
  purgeExportFiles(EXPORT_PREVIOUS_MAX_AGE_MS);
  const printed = await Print.printToFileAsync({ html });
  // expo-print dosyayı kendi geçici klasörüne yazar; paylaşılacak kopya uygulamanın dışa aktarma dizinine alınır, özgün silinir.
  const source = new File(printed.uri);
  const target = createExportFile(filename);
  try {
    await source.copy(target);
  } finally {
    try {
      if (source.exists) source.delete();
    } catch {
      // Geçici dosya açılışta ve "Tüm verilerimi sil" ile de temizlenir.
    }
  }
  try {
    if (!(await Sharing.isAvailableAsync())) throw new Error(t('share.unavailable'));
    await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', dialogTitle: filename });
  } catch (error) {
    discardExportFile(target);
    throw error;
  }
}

export async function pickTextFile(mimeTypes: string[]): Promise<string | null> {
  const result = await File.pickFileAsync({ mimeTypes, multipleFiles: false });
  if ('canceled' in result && result.canceled) return null;
  return result.result.text();
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character,
  );
}

export function pdfDocument(title: string, body: string): string {
  return `<!doctype html><html lang="${getActiveLocale()}"><head><meta charset="utf-8"><style>body{font:16px Arial;color:#241e20;padding:36px}h1{font:32px Georgia;color:#6f1d3a}h2{color:#6f1d3a;margin-top:28px}.row{padding:10px 0;border-bottom:1px solid #ded2c5}.muted{color:#6f6468}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px;border-bottom:1px solid #ded2c5}</style></head><body><h1>${escapeHtml(title)}</h1>${body}<p class="muted">${escapeHtml(t('export.pdfFooter'))}</p></body></html>`;
}
