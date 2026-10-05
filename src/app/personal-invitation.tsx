import { useState } from 'react';
import { Alert, Image, Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import type { PersonalInvitation } from '@/domain/models';
import {
  PersonalInvitationError,
  pickInvitationFromFiles,
  pickInvitationFromLibrary,
  preparePersonalInvitationFile,
  removePersonalInvitationFile,
  type ImportedInvitationImage,
} from '@/services/personal-invitations';
import { shareGeneratedFile } from '@/services/invitation-files';

type Source = 'photos' | 'files';

/** Kendi davetiyeni yükle: seçme, önizleme, değiştirme ve silme tek ekranda; görsel yalnız cihazda kalır. */
export default function PersonalInvitationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, savePersonalInvitation, deletePersonalInvitation, createId } = useApp();
  const theme = useAppTheme();
  const { t } = useI18n();
  const existing = data.personalInvitations.find((item) => item.id === id);
  const [name, setName] = useState(existing?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (id && !existing) {
    return (
      <Screen title={t('nav.personalInvitation')}>
        <EmptyState
          title={t('personal.notFoundTitle')}
          description={t('personal.notFoundBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  function showError(reason: unknown, title: string) {
    const message = reason instanceof Error ? reason.message : t('common.unknownError');
    if (reason instanceof PersonalInvitationError && reason.code === 'permission') {
      Alert.alert(title, message, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('personal.error.openSettings'), onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    Alert.alert(title, message);
  }

  async function pick(source: Source) {
    if (busy) return;
    setBusy(true);
    let picked: ImportedInvitationImage | undefined;
    try {
      const itemId = existing?.id ?? createId();
      picked = await (source === 'photos' ? pickInvitationFromLibrary(itemId) : pickInvitationFromFiles(itemId));
      if (!picked) return;
      const now = new Date().toISOString();
      const next: PersonalInvitation = {
        id: itemId,
        name:
          existing?.name ?? (name.trim() || t('personal.defaultName', { number: data.personalInvitations.length + 1 })),
        imageUri: picked.uri,
        width: picked.width,
        height: picked.height,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      try {
        await savePersonalInvitation(next);
      } catch (reason) {
        // Kayıt başarısızsa az önce kopyalanan dosya sahipsiz kalmasın; eski görsel zaten korunur.
        await removePersonalInvitationFile(picked.uri);
        showError(reason, t('personal.error.saveTitle'));
        return;
      }
      setImageFailed(false);
      if (!existing) router.replace(`/personal-invitation?id=${itemId}`);
    } catch (reason) {
      showError(reason, t('personal.error.title'));
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    if (!existing || busy) return;
    setBusy(true);
    try {
      await savePersonalInvitation({ ...existing, name, updatedAt: new Date().toISOString() });
    } catch (reason) {
      showError(reason, t('personal.error.saveTitle'));
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    if (!existing || busy) return;
    setBusy(true);
    try {
      // Yalnız işletim sisteminin paylaşım ekranı açılır; uygulama kimseye otomatik mesaj göndermez.
      await shareGeneratedFile(await preparePersonalInvitationFile(existing));
    } catch (reason) {
      showError(reason, t('personal.error.shareTitle'));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert(t('personal.deleteTitle'), t('personal.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deletePersonalInvitation(existing.id)
            .then(() => router.back())
            .catch((reason) => showError(reason, t('personal.error.saveTitle')));
        },
      },
    ]);
  }

  if (!existing) {
    return (
      <Screen title={t('nav.personalInvitation')} subtitle={t('personal.localOnly')}>
        <EmptyState title={t('personal.emptyTitle')} description={t('personal.emptyBody')} />
        <Button label={t('personal.fromPhotos')} onPress={() => void pick('photos')} loading={busy} />
        <Button
          label={t('personal.fromFiles')}
          onPress={() => void pick('files')}
          variant="secondary"
          disabled={busy}
        />
      </Screen>
    );
  }

  const aspectRatio = existing.width > 0 && existing.height > 0 ? existing.width / existing.height : 0.72;
  return (
    <Screen title={existing.name} subtitle={t('personal.localOnly')}>
      <Card>
        {imageFailed ? (
          <AppText color={theme.colors.warning} accessibilityRole="alert">
            {t('personal.imageMissing')}
          </AppText>
        ) : (
          <Image
            source={{ uri: existing.imageUri }}
            accessibilityRole="image"
            accessibilityLabel={t('personal.previewA11y', { name: existing.name })}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
            style={[styles.preview, { aspectRatio, backgroundColor: theme.colors.surfaceAlt }]}
          />
        )}
      </Card>
      <Card>
        <TextField label={t('personal.name')} value={name} onChangeText={setName} maxLength={60} />
        <Button
          label={t('personal.saveName')}
          onPress={() => void saveName()}
          variant="secondary"
          disabled={busy || name.trim() === existing.name}
        />
      </Card>
      <View style={styles.actions}>
        <Button label={t('personal.share')} onPress={() => void shareImage()} disabled={busy || imageFailed} />
        <Button
          label={t('personal.sendToGuests')}
          variant="secondary"
          onPress={() => router.push(`/invite-send?personalId=${existing.id}`)}
          disabled={busy || imageFailed || data.guests.length === 0}
        />
        {data.guests.length === 0 ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {t('personal.sendNeedsGuests')}
          </AppText>
        ) : null}
        <Button
          label={t('personal.replaceFromPhotos')}
          variant="secondary"
          onPress={() => void pick('photos')}
          loading={busy}
        />
        <Button
          label={t('personal.replaceFromFiles')}
          onPress={() => void pick('files')}
          variant="secondary"
          disabled={busy}
        />
        <Button label={t('personal.delete')} onPress={confirmDelete} variant="danger" disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', maxHeight: 560, borderRadius: radius.md },
  actions: { gap: spacing.md },
});
