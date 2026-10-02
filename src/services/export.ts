import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getActiveLocale, t } from '@/i18n';

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

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
  const file = new File(Paths.cache, safeName);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error(t('share.unavailable'));
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: t('export.shareTitle') });
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
  const result = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw new Error(t('share.unavailable'));
  await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: filename });
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
