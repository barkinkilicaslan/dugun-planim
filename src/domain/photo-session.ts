/**
 * Davetiye düzenleyicisindeki fotoğraf yaşam döngüsü. Yeni seçilen dosyalar "bekleyen" sayılır ve yalnız kayıt
 * başarılı olursa kalıcı olur; kayıtlı (eski) dosya hiçbir zaman burada silinmez; yerine geçtiğinde silme işini
 * kayıt başarıyla bittikten sonra uygulama bağlamı yapar.
 */
export interface PhotoSession {
  /** Şu an önizlemede/formda görünen fotoğraf (boş olabilir). */
  current: string;
  /** Bu düzenleme oturumunda oluşturulan ve henüz kaydedilmemiş dosyalar. */
  pending: readonly string[];
}

export interface PhotoStep {
  session: PhotoSession;
  /** Hemen silinebilecek, hiçbir kayda ait olmayan dosyalar. */
  discard: readonly string[];
}

export function startPhotoSession(savedUri: string): PhotoSession {
  return { current: savedUri, pending: [] };
}

/** Yeni fotoğraf seçildi; önceki bekleyen (kaydedilmemiş) seçim artık gereksizdir, kayıtlı fotoğrafa dokunulmaz. */
export function pickPhoto(session: PhotoSession, uri: string): PhotoStep {
  const discard = session.pending.includes(session.current) ? [session.current] : [];
  return {
    session: { current: uri, pending: [...session.pending.filter((item) => item !== session.current), uri] },
    discard,
  };
}

/** "Fotoğrafı kaldır": yalnız form durumu değişir; kayıtlı dosya Kaydet'e kadar silinmez. */
export function clearPhoto(session: PhotoSession): PhotoStep {
  const discard = session.pending.includes(session.current) ? [session.current] : [];
  return { session: { current: '', pending: session.pending.filter((item) => item !== session.current) }, discard };
}

/** Kayıt başarılı: bekleyen dosya kalıcı oldu. */
export function commitPhotoSession(session: PhotoSession): PhotoSession {
  return { current: session.current, pending: [] };
}

/** Kaydetmeden çıkış: bekleyen tüm yeni dosyalar silinir, kayıtlı fotoğraf çalışmaya devam eder. */
export function abandonPhotoSession(session: PhotoSession): readonly string[] {
  return session.pending;
}
