import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import { duplicateMessage, findDuplicateGuest, normalizePhone } from '@/domain/contacts';
import type { Guest, GuestGroup, GuestSide, RsvpStatus } from '@/domain/models';
import {
  adultCount,
  applyManualRsvp,
  clearInviteStatus,
  INVITE_CHANNEL_LABELS,
  INVITE_STATUS_LABELS,
  markInviteSent,
  RSVP_LABELS,
  RSVP_SOURCE_LABELS,
} from '@/domain/rsvp';
import { formatLongTr } from '@/domain/wedding-date';

export default function GuestEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveGuest, deleteGuest } = useApp();
  const theme = useAppTheme();
  const existing = data.guests.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<Guest>(
    existing ?? {
      id: createId(),
      name: '',
      phone: '',
      email: '',
      side: 'common',
      partySize: 1,
      childCount: 0,
      rsvp: 'pending',
      notes: '',
      mealNotes: '',
      group: 'other',
      rsvpSource: 'none',
      rsvpRespondedAt: '',
      lastInviteSentAt: '',
      lastInviteChannel: '',
      inviteStatus: 'none',
      createdAt: now,
      updatedAt: now,
    },
  );
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof Guest>(key: K, value: Guest[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    try {
      setSaving(true);
      const stamp = new Date().toISOString();
      const duplicate = findDuplicateGuest(data.guests, { phone: form.phone, email: form.email }, form.id);
      if (duplicate) throw new Error(duplicateMessage(duplicate));
      const phone = normalizePhone(form.phone)?.display ?? form.phone.trim();
      // Durum değiştiyse kaynak "manuel" olur ve yanıt tarihi güncellenir; değişmediyse mevcut kaynak korunur.
      const previousStatus = existing?.rsvp ?? 'pending';
      const withRsvp =
        previousStatus === form.rsvp ? form : applyManualRsvp({ ...form, rsvp: previousStatus }, form.rsvp, stamp);
      await saveGuest({ ...withRsvp, phone, updatedAt: stamp });
      router.back();
    } catch (error) {
      Alert.alert('Davetli kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert('Davetli silinsin mi?', 'Masa ataması da kaldırılır. Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteGuest(form.id).then(() => router.back()) },
    ]);
  }
  const adults = adultCount(form);
  const showChildWarning = data.profile.adultsOnly && form.childCount > 0;
  return (
    <Screen title={existing ? 'Davetliyi düzenle' : 'Yeni davetli'}>
      <Card>
        <TextField
          label="Ad soyad / aile adı"
          value={form.name}
          onChangeText={(value) => update('name', value)}
          autoCapitalize="words"
          autoFocus
        />
        <TextField
          label="Telefon (isteğe bağlı)"
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          keyboardType="phone-pad"
        />
        <TextField
          label="E-posta (isteğe bağlı)"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Chips<GuestSide>
          label="Taraf"
          value={form.side}
          onChange={(value) => update('side', value)}
          options={[
            { value: 'couple1', label: data.profile.couple1Name || '1. taraf' },
            { value: 'couple2', label: data.profile.couple2Name || '2. taraf' },
            { value: 'common', label: 'Ortak' },
          ]}
        />
        <View style={styles.two}>
          <TextField
            label="Toplam kişi"
            value={String(form.partySize)}
            onChangeText={(value) => update('partySize', Number.parseInt(value, 10) || 0)}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextField
            label="Çocuk"
            value={String(form.childCount)}
            onChangeText={(value) => update('childCount', Number.parseInt(value, 10) || 0)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        <AppText variant="caption" color={theme.colors.muted}>
          Yetişkin: {adults} · Çocuk: {form.childCount}
        </AppText>
        {showChildWarning ? (
          <AppText variant="caption" color={theme.colors.warning}>
            Düğününüz yetişkinlere özel olarak işaretli. Çocuk sayısını yalnız istisnai durumlarda girin.
          </AppText>
        ) : null}
        <Chips<RsvpStatus>
          label="Davet durumu"
          value={form.rsvp}
          onChange={(value) => update('rsvp', value)}
          options={[
            { value: 'pending', label: RSVP_LABELS.pending },
            { value: 'attending', label: RSVP_LABELS.attending },
            { value: 'declined', label: RSVP_LABELS.declined },
            { value: 'maybe', label: RSVP_LABELS.maybe },
          ]}
        />
        {existing ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {RSVP_SOURCE_LABELS[existing.rsvpSource]}
            {existing.rsvpRespondedAt ? ` · ${formatLongTr(existing.rsvpRespondedAt.slice(0, 10))}` : ''}
          </AppText>
        ) : null}
        <Chips<GuestGroup>
          label="Grup"
          value={form.group}
          onChange={(value) => update('group', value)}
          options={[
            { value: 'family', label: 'Aile' },
            { value: 'friends', label: 'Arkadaş' },
            { value: 'work', label: 'İş' },
            { value: 'other', label: 'Diğer' },
          ]}
        />
        <TextField
          label="Yemek tercihi / alerji"
          value={form.mealNotes}
          onChangeText={(value) => update('mealNotes', value)}
          multiline
        />
        <TextField label="Notlar" value={form.notes} onChangeText={(value) => update('notes', value)} multiline />
        <View style={styles.actions}>
          <Button label="Kaydet" onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} disabled={saving} /> : null}
        </View>
      </Card>
      {existing ? (
        <Card>
          <AppText variant="label">Davetiye gönderimi</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {INVITE_STATUS_LABELS[existing.inviteStatus]}
            {existing.lastInviteChannel ? ` · ${INVITE_CHANNEL_LABELS[existing.lastInviteChannel]}` : ''}
            {existing.lastInviteSentAt ? ` · ${formatLongTr(existing.lastInviteSentAt.slice(0, 10))}` : ''}
          </AppText>
          <Button
            label="Gönderildi olarak işaretle"
            variant="secondary"
            disabled={existing.inviteStatus === 'markedSent'}
            onPress={() => {
              const stamp = new Date().toISOString();
              void saveGuest(markInviteSent(existing, stamp)).then(() => router.back());
            }}
          />
          <Button
            label="Gönderim durumunu sıfırla"
            variant="ghost"
            disabled={existing.inviteStatus === 'none'}
            onPress={() => {
              const stamp = new Date().toISOString();
              void saveGuest(clearInviteStatus(existing, stamp)).then(() => router.back());
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  two: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  input: { minWidth: 130 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
});
