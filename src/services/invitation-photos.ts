import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

/** Davetiye fotoğrafı: sistem dosya seçicisiyle seçilir ve uygulama klasörüne kopyalanır; fotoğraf izni gerekmez. */

const PHOTO_DIR = 'invitation-photos';
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function photoDirectory(): Directory {
  return new Directory(Paths.document, PHOTO_DIR);
}

export async function pickInvitationPhoto(designId: string): Promise<string | undefined> {
  if (Platform.OS === 'web') throw new Error('Fotoğraf ekleme web önizlemesinde kullanılamıyor.');
  const result = await File.pickFileAsync({
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    multipleFiles: false,
  });
  if (result.canceled) return undefined;
  const source = result.result;
  const extension = source.extension.replace('.', '').toLowerCase();
  if (!PHOTO_EXTENSIONS.includes(extension)) throw new Error('Yalnız JPG, PNG veya WebP fotoğraf eklenebilir.');
  if (source.size > MAX_PHOTO_BYTES) throw new Error('Fotoğraf 15 MB sınırını aşıyor.');
  const directory = photoDirectory();
  if (!directory.exists) directory.create({ intermediates: true });
  const target = new File(directory, `${designId.replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}.${extension}`);
  await source.copy(target);
  return target.uri;
}

/**
 * Yalnız uygulamanın kendi fotoğraf klasöründeki dosyayı siler. Silme başarısız olursa kullanıcının kaydı
 * etkilenmez (dosya "Tüm verilerimi sil" ile de temizlenir); sonuç `false` olarak döner.
 */
export async function removeInvitationPhoto(uri?: string): Promise<boolean> {
  if (!uri || Platform.OS === 'web' || !uri.includes(`/${PHOTO_DIR}/`)) return false;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    return true;
  } catch {
    return false;
  }
}

export async function removeAllInvitationPhotos(): Promise<void> {
  if (Platform.OS === 'web') return;
  const directory = photoDirectory();
  if (directory.exists) directory.delete();
}

/** Hiçbir tasarımın kullanmadığı (ör. kaydedilmeden kapatılan düzenlemeden kalan) fotoğraf dosyalarını siler. */
export async function removeUnreferencedInvitationPhotos(referenced: readonly string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  const directory = photoDirectory();
  if (!directory.exists) return;
  for (const entry of directory.list()) {
    if (entry instanceof File && !referenced.includes(entry.uri)) await removeInvitationPhoto(entry.uri);
  }
}
