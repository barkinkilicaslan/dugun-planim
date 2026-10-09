import { useEffect, useRef, useState } from 'react';
import { Alert, PixelRatio, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScaledInvitation } from '@/components/invitation/scaled-invitation';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { DateField, TimeField } from '@/components/ui/date-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import {
  createInvitationDesign,
  defaultCoupleNames,
  invitationFileBase,
  resolveInvitationContent,
  storedOverride,
} from '@/domain/invitation-content';
import {
  INVITATION_PALETTES,
  INVITATION_TEMPLATES,
  INVITATION_TEMPLATE_IDS,
  paletteById,
  paletteName,
  resolveAdultsOnlyText,
  templateById,
  templateName,
  templateSupportsPhoto,
} from '@/domain/invitation-templates';
import type { InvitationDesign, InvitationTemplateId } from '@/domain/models';
import { todayIso } from '@/domain/wedding-date';
import {
  renderInvitationPdf,
  renderInvitationPng,
  shareGeneratedFile,
  type GeneratedInvitationFile,
} from '@/services/invitation-files';
import {
  abandonPhotoSession,
  clearPhoto,
  commitPhotoSession,
  pickPhoto as pickPhotoStep,
  startPhotoSession,
  type PhotoSession,
} from '@/domain/photo-session';
import { pickInvitationPhoto, removeInvitationPhoto } from '@/services/invitation-photos';

function isTemplateId(value: string | undefined): value is InvitationTemplateId {
  return INVITATION_TEMPLATE_IDS.some((id) => id === value);
}

export default function InvitationEditor() {
  const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
  const { data, createId, saveInvitationDesign, deleteInvitationDesign } = useApp();
  const theme = useAppTheme();
  const i18n = useI18n();
  const { t } = i18n;
  const { width: windowWidth } = useWindowDimensions();
  const existing = data.invitationDesigns.find((item) => item.id === id);
  const [form, setForm] = useState<InvitationDesign>(
    () =>
      existing ??
      createInvitationDesign(
        createId(),
        isTemplateId(template) ? template : 'classic',
        new Date().toISOString(),
        data.invitationDesigns.length === 0,
        t,
      ),
  );
  const [busy, setBusy] = useState<'save' | 'png' | 'pdf'>();
  const cardRef = useRef<View>(null);
  const photoSession = useRef<PhotoSession>(startPhotoSession(existing?.photoUri ?? ''));

  // Kaydedilmeden çıkılırsa bu oturumda seçilen yeni fotoğraflar silinir; kayıtlı fotoğraf korunur.
  useEffect(
    () => () => {
      for (const uri of abandonPhotoSession(photoSession.current)) void removeInvitationPhoto(uri);
    },
    [],
  );
  const update = <K extends keyof InvitationDesign>(key: K, value: InvitationDesign[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectedTemplate = templateById(form.templateId);
  const palette = paletteById(form.paletteId);
  const previewWidth = Math.min(windowWidth - spacing.lg * 2, 360);
  const content = resolveInvitationContent(form, data.profile, i18n);
  const profile = data.profile;

  function changeTemplate(next: InvitationTemplateId) {
    const nextTemplate = templateById(next);
    setForm((current) => ({
      ...current,
      templateId: next,
      // Palet kullanıcı tarafından değiştirilmediyse şablonun varsayılan paletine geçilir.
      paletteId:
        current.paletteId === templateById(current.templateId).defaultPaletteId
          ? nextTemplate.defaultPaletteId
          : current.paletteId,
    }));
  }

  /** Profille aynı olan alanlar boş saklanır; böylece profil değişince davetiye de güncel kalır. */
  function normalized(): InvitationDesign {
    return {
      ...form,
      coupleNames: storedOverride(form.coupleNames, defaultCoupleNames(profile)),
      weddingDate: storedOverride(form.weddingDate, profile.weddingDate),
      adultsOnlyMessage: storedOverride(form.adultsOnlyMessage, profile.adultsOnlyMessage),
      updatedAt: new Date().toISOString(),
    };
  }

  async function save(): Promise<boolean> {
    try {
      setBusy('save');
      await saveInvitationDesign(normalized());
      photoSession.current = commitPhotoSession(photoSession.current);
      return true;
    } catch (error) {
      Alert.alert(t('invEditor.saveFailed'), (error as Error).message);
      return false;
    } finally {
      setBusy(undefined);
    }
  }

  async function pickPhoto() {
    try {
      const uri = await pickInvitationPhoto(form.id);
      if (!uri) return;
      const step = pickPhotoStep(photoSession.current, uri);
      photoSession.current = step.session;
      for (const unused of step.discard) await removeInvitationPhoto(unused);
      update('photoUri', uri);
    } catch (error) {
      Alert.alert(t('invEditor.photoFailed'), (error as Error).message);
    }
  }

  /** Kayıtlı dosya burada silinmez; yalnız formdan çıkarılır ve Kaydet ile birlikte kalıcı olarak silinir. */
  async function removePhoto() {
    const step = clearPhoto(photoSession.current);
    photoSession.current = step.session;
    for (const unused of step.discard) await removeInvitationPhoto(unused);
    update('photoUri', '');
  }

  async function exportFile(kind: 'png' | 'pdf') {
    try {
      setBusy(kind);
      const base = invitationFileBase(form, t);
      const png: GeneratedInvitationFile = await renderInvitationPng(cardRef, base, PixelRatio.get());
      const file = kind === 'png' ? png : await renderInvitationPdf(png, base);
      await shareGeneratedFile(file);
    } catch (error) {
      Alert.alert(kind === 'png' ? t('invEditor.pngFailed') : t('invEditor.pdfFailed'), (error as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  function confirmDelete() {
    Alert.alert(t('invEditor.deleteTitle'), t('invEditor.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteInvitationDesign(form.id)
            .then(() => router.back())
            .catch((error) =>
              Alert.alert(t('common.deleteFailed'), error instanceof Error ? error.message : t('common.unknownError')),
            ),
      },
    ]);
  }

  return (
    <Screen title={existing ? t('invEditor.edit') : t('invEditor.new')}>
      <View style={styles.preview}>
        <ScaledInvitation
          width={previewWidth}
          content={content}
          template={selectedTemplate}
          palette={palette}
          cardRef={cardRef}
        />
      </View>
      <Card>
        <TextField
          label={t('invEditor.designName')}
          value={form.name}
          onChangeText={(value) => update('name', value)}
        />
        <Chips<InvitationTemplateId>
          label={t('invEditor.template')}
          value={form.templateId}
          onChange={changeTemplate}
          options={INVITATION_TEMPLATES.map((item) => ({ value: item.id, label: templateName(t, item.id) }))}
        />
        <View style={styles.group}>
          <AppText variant="label">{t('invEditor.palette')}</AppText>
          <View style={styles.swatches}>
            {INVITATION_PALETTES.map((item) => {
              const selected = item.id === form.paletteId;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={t('invEditor.paletteA11y', { name: paletteName(t, item.id) })}
                  onPress={() => update('paletteId', item.id)}
                  style={[
                    styles.swatch,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      borderWidth: selected ? 3 : 1,
                    },
                  ]}
                >
                  <View style={[styles.swatchHalf, { backgroundColor: item.background }]} />
                  <View style={[styles.swatchHalf, { backgroundColor: item.accent }]} />
                </Pressable>
              );
            })}
          </View>
          <AppText variant="caption" color={theme.colors.muted}>
            {t('invEditor.paletteSelected', { name: paletteName(t, palette.id) })}
          </AppText>
        </View>
      </Card>
      <Card>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('invEditor.blankHint')}
        </AppText>
        <TextField
          label={t('invEditor.coupleNames')}
          value={form.coupleNames}
          placeholder={defaultCoupleNames(profile)}
          onChangeText={(value) => update('coupleNames', value)}
          autoCapitalize="words"
          maxLength={80}
        />
        <DateField
          label={t('invEditor.weddingDate')}
          value={form.weddingDate || profile.weddingDate}
          onChange={(value) => update('weddingDate', value)}
        />
        <TimeField
          label={t('invEditor.weddingTime')}
          value={form.weddingTime}
          onChange={(value) => update('weddingTime', value)}
          clearable
        />
        <TextField
          label={t('invEditor.venueName')}
          value={form.venueName}
          onChangeText={(value) => update('venueName', value)}
          maxLength={120}
        />
        <TextField
          label={t('invEditor.venueAddress')}
          value={form.venueAddress}
          onChangeText={(value) => update('venueAddress', value)}
          multiline
          maxLength={240}
        />
        <TextField
          label={t('invEditor.message')}
          value={form.message}
          placeholder={content.message}
          onChangeText={(value) => update('message', value)}
          multiline
          maxLength={600}
        />
        <DateField
          label={t('invEditor.rsvpDeadline')}
          value={form.rsvpDeadline}
          minimumDate={todayIso()}
          onChange={(value) => update('rsvpDeadline', value)}
          clearable
        />
      </Card>
      {templateSupportsPhoto(selectedTemplate) ? (
        <Card>
          <AppText variant="label">{t('invEditor.photoTitle')}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {t('invEditor.photoHint')}
          </AppText>
          <Button
            label={form.photoUri ? t('invEditor.changePhoto') : t('invEditor.pickPhoto')}
            variant="secondary"
            onPress={() => void pickPhoto()}
          />
          {form.photoUri ? (
            <Button label={t('invEditor.removePhoto')} variant="ghost" onPress={() => void removePhoto()} />
          ) : null}
        </Card>
      ) : null}
      <Card>
        <AppText variant="label">{t('invEditor.adultsNote')}</AppText>
        {profile.adultsOnly ? (
          <TextField
            label={t('invEditor.adultsMessage')}
            value={resolveAdultsOnlyText(t, form.adultsOnlyMessage)}
            placeholder={resolveAdultsOnlyText(t, profile.adultsOnlyMessage)}
            onChangeText={(value) => update('adultsOnlyMessage', value)}
            multiline
            maxLength={400}
          />
        ) : (
          <>
            <AppText variant="caption" color={theme.colors.muted}>
              {t('invEditor.adultsOff')}
            </AppText>
            <Button
              label={t('invEditor.turnOnInSettings')}
              variant="secondary"
              onPress={() => router.push('/settings')}
            />
          </>
        )}
      </Card>
      <Card>
        <Button
          label={t('common.save')}
          onPress={() => void save().then((ok) => ok && router.back())}
          loading={busy === 'save'}
        />
        <Button
          label={t('invEditor.makeDefault')}
          variant="secondary"
          onPress={() => update('isDefault', true)}
          disabled={form.isDefault}
        />
        <View style={styles.exportRow}>
          <Button
            label={t('invEditor.createPng')}
            variant="secondary"
            onPress={() => void exportFile('png')}
            loading={busy === 'png'}
            style={styles.grow}
          />
          <Button
            label={t('invEditor.createPdf')}
            variant="secondary"
            onPress={() => void exportFile('pdf')}
            loading={busy === 'pdf'}
            style={styles.grow}
          />
        </View>
        <Button
          label={t('invEditor.sendToGuests')}
          variant="ghost"
          onPress={() => void save().then((ok) => ok && router.push(`/invite-send?designId=${form.id}`))}
        />
        {existing ? <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center' },
  group: { gap: spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 44, height: 44, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row' },
  swatchHalf: { flex: 1 },
  exportRow: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
});
