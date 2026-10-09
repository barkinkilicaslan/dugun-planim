import { Image, Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { invitationFileBase } from '@/domain/invitation-content';
import type { PersonalInvitation } from '@/domain/models';
import { t } from '@/i18n';
import { cleanupInvitationTemp, type GeneratedInvitationFile } from './invitation-files';

/**
 * Kullanıcının kendi hazırladığı davetiye görseli (JPG/PNG). Görsel fotoğraf arşivinden (sistem fotoğraf seçicisi)
 * veya dosya seçiciden alınır ve yalnız cihazdaki uygulama klasörüne kopyalanır; sunucuya gönderilmez.
 * PDF desteği bu sürümde yoktur (uygulama içi önizleme için belge görüntüleyici gerekir).
 */

const DIRECTORY = 'personal-invitations';
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_PIXELS = 50_000_000;
const EXTENSIONS = ['jpg', 'jpeg', 'png'];

export type PersonalInvitationErrorCode = 'permission' | 'format' | 'size' | 'dimensions' | 'copy' | 'web' | 'missing';

export class PersonalInvitationError extends Error {
  constructor(
    readonly code: PersonalInvitationErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface ImportedInvitationImage {
  uri: string;
  width: number;
  height: number;
}

function directory(): Directory {
  return new Directory(Paths.document, DIRECTORY);
}

function assertNative(): void {
  if (Platform.OS === 'web') throw new PersonalInvitationError('web', t('personal.error.web'));
}

/** Uzantıyı dosya adından, olmazsa MIME türünden bulur; desteklenmiyorsa boş döner. */
export function imageExtension(name?: string | null, mimeType?: string | null): string {
  const fromName = (name ?? '').split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  if (EXTENSIONS.includes(fromName)) return fromName === 'jpeg' ? 'jpg' : fromName;
  const mime = (mimeType ?? '').toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return '';
}

function measure(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

async function copyIntoApp(
  source: File,
  id: string,
  extension: string,
  size: { width: number; height: number },
): Promise<ImportedInvitationImage> {
  if (!extension) throw new PersonalInvitationError('format', t('personal.error.badFormat'));
  if (source.size > MAX_BYTES) throw new PersonalInvitationError('size', t('personal.error.tooLarge'));
  try {
    const target = directory();
    if (!target.exists) target.create({ intermediates: true });
    const file = new File(target, `${id.replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}.${extension}`);
    await source.copy(file);
    const dimensions = size.width > 0 && size.height > 0 ? size : await measure(file.uri);
    if (
      !Number.isFinite(dimensions.width) ||
      !Number.isFinite(dimensions.height) ||
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width * dimensions.height > MAX_PIXELS
    ) {
      try {
        if (file.exists) file.delete();
      } catch {
        // A failed import must not replace or invalidate an existing saved invitation.
      }
      throw new PersonalInvitationError('dimensions', t('personal.error.badDimensions'));
    }
    return { uri: file.uri, ...dimensions };
  } catch (reason) {
    if (reason instanceof PersonalInvitationError) throw reason;
    throw new PersonalInvitationError('copy', t('personal.error.copy'));
  }
}

function isPermissionError(reason: unknown): boolean {
  return /permission|denied|authori[sz]/i.test(reason instanceof Error ? reason.message : String(reason));
}

/** Fotoğraf arşivi: iOS'ta sistem seçicisi (PHPicker) izin istemeden yalnız seçilen görseli verir. */
export async function pickInvitationFromLibrary(id: string): Promise<ImportedInvitationImage | undefined> {
  assertNative();
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
  } catch (reason) {
    if (isPermissionError(reason)) throw new PersonalInvitationError('permission', t('personal.error.permission'));
    throw new PersonalInvitationError('copy', t('personal.error.copy'));
  }
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return undefined;
  return copyIntoApp(new File(asset.uri), id, imageExtension(asset.fileName ?? asset.uri, asset.mimeType), {
    width: asset.width ?? 0,
    height: asset.height ?? 0,
  });
}

/** Dosyalar uygulaması / iCloud Drive: yalnız JPG ve PNG. */
export async function pickInvitationFromFiles(id: string): Promise<ImportedInvitationImage | undefined> {
  assertNative();
  const picked = await File.pickFileAsync({ mimeTypes: ['image/jpeg', 'image/png'], multipleFiles: false });
  if (picked.canceled) return undefined;
  const source = picked.result;
  return copyIntoApp(source, id, imageExtension(source.name, source.type), { width: 0, height: 0 });
}

/**
 * Yüklenen davetiyeyi paylaşıma/e-posta ekine hazırlar: dosyanın hâlâ var olduğunu doğrular ve anlamlı bir adla
 * önbelleğe kopyalar (file:// URI). Hiçbir şey gönderilmez; yalnız işletim sisteminin ekranı açılabilsin diye
 * dosya hazırlanır. Dosya yoksa anlaşılır bir hata verir.
 */
export async function preparePersonalInvitationFile(
  item: Pick<PersonalInvitation, 'name' | 'imageUri'>,
): Promise<GeneratedInvitationFile> {
  assertNative();
  const missing = () => new PersonalInvitationError('missing', t('personal.error.fileMissing'));
  if (!item.imageUri.includes(`/${DIRECTORY}/`)) throw missing();
  const source = new File(item.imageUri);
  if (!source.exists) throw missing();
  const extension = imageExtension(source.name || item.imageUri, source.type);
  if (!extension) throw new PersonalInvitationError('format', t('personal.error.badFormat'));
  cleanupInvitationTemp();
  const target = new File(Paths.cache, `${invitationFileBase(item, t)}.${extension}`);
  try {
    if (target.exists) target.delete();
    await source.copy(target);
  } catch {
    throw missing();
  }
  return {
    uri: target.uri,
    mimeType: extension === 'png' ? 'image/png' : 'image/jpeg',
    filename: target.name,
  };
}

/** Yalnız uygulamanın kendi klasöründeki dosyayı siler; başarısızlıkta kullanıcı kaydı etkilenmez. */
export async function removePersonalInvitationFile(uri?: string): Promise<boolean> {
  if (!uri || Platform.OS === 'web' || !uri.includes(`/${DIRECTORY}/`)) return false;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

export async function removeAllPersonalInvitationFiles(): Promise<void> {
  if (Platform.OS === 'web') return;
  const target = directory();
  if (target.exists) target.delete();
}

/** Hiçbir kayda ait olmayan (ör. kayıt hatasından kalan) dosyaları siler. */
export async function removeUnreferencedPersonalInvitationFiles(referenced: readonly string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  const target = directory();
  if (!target.exists) return;
  for (const entry of target.list()) {
    if (entry instanceof File && !referenced.includes(entry.uri)) await removePersonalInvitationFile(entry.uri);
  }
}
