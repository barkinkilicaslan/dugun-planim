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
  templateById,
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
  const content = resolveInvitationContent(form, data.profile);
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
      Alert.alert('Davetiye kaydedilemedi', (error as Error).message);
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
      Alert.alert('Fotoğraf eklenemedi', (error as Error).message);
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
      const base = invitationFileBase(form);
      const png: GeneratedInvitationFile = await renderInvitationPng(cardRef, base, PixelRatio.get());
      const file = kind === 'png' ? png : await renderInvitationPdf(png, base);
      await shareGeneratedFile(file);
    } catch (error) {
      Alert.alert(kind === 'png' ? 'PNG oluşturulamadı' : 'PDF oluşturulamadı', (error as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  function confirmDelete() {
    Alert.alert('Davetiye silinsin mi?', 'Bu tasarım ve eklediğiniz fotoğraf kalıcı olarak silinir.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => void deleteInvitationDesign(form.id).then(() => router.back()),
      },
    ]);
  }

  return (
    <Screen title={existing ? 'Davetiyeyi düzenle' : 'Yeni davetiye'}>
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
        <TextField label="Tasarım adı" value={form.name} onChangeText={(value) => update('name', value)} />
        <Chips<InvitationTemplateId>
          label="Şablon"
          value={form.templateId}
          onChange={changeTemplate}
          options={INVITATION_TEMPLATES.map((item) => ({ value: item.id, label: item.name }))}
        />
        <View style={styles.group}>
          <AppText variant="label">Renk paleti</AppText>
          <View style={styles.swatches}>
            {INVITATION_PALETTES.map((item) => {
              const selected = item.id === form.paletteId;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Renk paleti: ${item.name}`}
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
            Seçili palet: {palette.name}
          </AppText>
        </View>
      </Card>
      <Card>
        <AppText variant="caption" color={theme.colors.muted}>
          Boş bıraktığınız alanlar için düğün ayarlarındaki değerler kullanılır.
        </AppText>
        <TextField
          label="Çiftin isimleri"
          value={form.coupleNames}
          placeholder={defaultCoupleNames(profile)}
          onChangeText={(value) => update('coupleNames', value)}
          autoCapitalize="words"
          maxLength={80}
        />
        <DateField
          label="Düğün tarihi"
          value={form.weddingDate || profile.weddingDate}
          onChange={(value) => update('weddingDate', value)}
        />
        <TimeField
          label="Düğün saati"
          value={form.weddingTime}
          onChange={(value) => update('weddingTime', value)}
          clearable
        />
        <TextField
          label="Mekân adı"
          value={form.venueName}
          onChangeText={(value) => update('venueName', value)}
          maxLength={120}
        />
        <TextField
          label="Mekân adresi"
          value={form.venueAddress}
          onChangeText={(value) => update('venueAddress', value)}
          multiline
          maxLength={240}
        />
        <TextField
          label="Davet metni"
          value={form.message}
          placeholder={content.message}
          onChangeText={(value) => update('message', value)}
          multiline
          maxLength={600}
        />
        <DateField
          label="RSVP son cevap tarihi"
          value={form.rsvpDeadline}
          minimumDate={todayIso()}
          onChange={(value) => update('rsvpDeadline', value)}
          clearable
        />
      </Card>
      {templateSupportsPhoto(selectedTemplate) ? (
        <Card>
          <AppText variant="label">Fotoğraf</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            Fotoğraf cihazınızdan seçilir ve yalnızca bu cihazda saklanır.
          </AppText>
          <Button
            label={form.photoUri ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}
            variant="secondary"
            onPress={() => void pickPhoto()}
          />
          {form.photoUri ? (
            <Button label="Fotoğrafı kaldır" variant="ghost" onPress={() => void removePhoto()} />
          ) : null}
        </Card>
      ) : null}
      <Card>
        <AppText variant="label">Çocuksuz düğün notu</AppText>
        {profile.adultsOnly ? (
          <TextField
            label="Davetiyedeki mesaj"
            value={form.adultsOnlyMessage}
            placeholder={profile.adultsOnlyMessage}
            onChangeText={(value) => update('adultsOnlyMessage', value)}
            multiline
            maxLength={400}
          />
        ) : (
          <>
            <AppText variant="caption" color={theme.colors.muted}>
              “Düğünümüz yetişkinlere özeldir” ayarı kapalı; davetiyede çocuk notu görünmez.
            </AppText>
            <Button label="Ayarlarda aç" variant="secondary" onPress={() => router.push('/settings')} />
          </>
        )}
      </Card>
      <Card>
        <Button
          label="Kaydet"
          onPress={() => void save().then((ok) => ok && router.back())}
          loading={busy === 'save'}
        />
        <Button
          label="Varsayılan davetiye yap"
          variant="secondary"
          onPress={() => update('isDefault', true)}
          disabled={form.isDefault}
        />
        <View style={styles.exportRow}>
          <Button
            label="PNG oluştur"
            variant="secondary"
            onPress={() => void exportFile('png')}
            loading={busy === 'png'}
            style={styles.grow}
          />
          <Button
            label="PDF oluştur"
            variant="secondary"
            onPress={() => void exportFile('pdf')}
            loading={busy === 'pdf'}
            style={styles.grow}
          />
        </View>
        <Button
          label="Davetlilere gönder"
          variant="ghost"
          onPress={() => void save().then((ok) => ok && router.push(`/invite-send?designId=${form.id}`))}
        />
        {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} /> : null}
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
