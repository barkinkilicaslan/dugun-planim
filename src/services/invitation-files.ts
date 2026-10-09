import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { t } from '@/i18n';

/** Davetiye PNG/PDF üretimi ve paylaşımı. Dosyalar yalnız cihazda oluşur; hiçbir şey sunucuya gönderilmez. */

/** PNG çıktısı 1080 × 1620 piksel (kartın 3 katı). */
const PNG_WIDTH = 1080;
const PNG_HEIGHT = 1620;
/** Dosya adı ön ekleri (her iki dilde); eski oturumlardan kalan geçici dosyalar için ikisi de temizlenir. */
const TEMP_PREFIXES = ['davetiye-', 'invitation-'];

/** Davetiye PNG/PDF geçici dosyalarını siler; kaç dosyanın silindiğini ve kaçının silinemediğini bildirir. Hata atmaz. */
export function removeInvitationTempFiles(): { removed: number; failed: number } {
  const result = { removed: 0, failed: 0 };
  if (Platform.OS === 'web') return result;
  try {
    for (const entry of Paths.cache.list()) {
      if (!(entry instanceof File) || !TEMP_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue;
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

/** Önceki oturumlardan kalan davetiye PNG/PDF geçici dosyalarını siler (başarısızlık akışı etkilemez). */
export function cleanupInvitationTemp(): void {
  removeInvitationTempFiles();
}

/** Üreticinin (view-shot, expo-print) bıraktığı geçici dosyayı siler; kopyalama başarısız olsa bile kalıntı kalmasın. */
function removeQuietly(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // Açılışta ve "Tüm verilerimi sil" ile de temizlenir.
  }
}

function tempFile(name: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  return file;
}

export interface GeneratedInvitationFile {
  uri: string;
  mimeType: 'image/png' | 'image/jpeg' | 'application/pdf';
  filename: string;
}

/** Ekrandaki davetiye kartını (sabit 360×540) PNG olarak yakalar. */
export async function renderInvitationPng(
  cardRef: Parameters<typeof captureRef>[0],
  fileBase: string,
  pixelRatio: number,
): Promise<GeneratedInvitationFile> {
  if (Platform.OS === 'web') throw new Error(t('invitation.pngWebUnavailable'));
  cleanupInvitationTemp();
  const captured = await captureRef(cardRef, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: PNG_WIDTH / pixelRatio,
    height: PNG_HEIGHT / pixelRatio,
  });
  const source = new File(captured);
  try {
    const target = tempFile(`${fileBase}.png`);
    await source.copy(target);
    return { uri: target.uri, mimeType: 'image/png', filename: target.name };
  } finally {
    removeQuietly(source);
  }
}

/** PNG davetiyeyi tek sayfalık PDF'e yerleştirir (6 × 9 inç). */
export async function renderInvitationPdf(
  png: GeneratedInvitationFile,
  fileBase: string,
): Promise<GeneratedInvitationFile> {
  const base64 = await new File(png.uri).base64();
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>@page{margin:0}html,body{margin:0;padding:0}img{display:block;width:100%;height:100%}</style></head><body><img src="data:image/png;base64,${base64}" /></body></html>`;
  const printed = await Print.printToFileAsync({ html, width: 432, height: 648 });
  const source = new File(printed.uri);
  try {
    const target = tempFile(`${fileBase}.pdf`);
    await source.copy(target);
    return { uri: target.uri, mimeType: 'application/pdf', filename: target.name };
  } finally {
    removeQuietly(source);
  }
}

export async function shareGeneratedFile(file: GeneratedInvitationFile): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error(t('share.unavailable'));
  await Sharing.shareAsync(file.uri, { mimeType: file.mimeType, dialogTitle: t('invitation.shareTitle') });
}
