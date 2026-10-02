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
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { duplicateMessage, findDuplicateGuest, normalizePhone } from '@/domain/contacts';
import type { Guest, GuestGroup, GuestSide, RsvpStatus } from '@/domain/models';
import {
  adultCount,
  applyManualRsvp,
  clearInviteStatus,
  inviteChannelLabel,
  inviteStatusLabel,
  markInviteSent,
  rsvpLabel,
  rsvpSourceLabel,
} from '@/domain/rsvp';
import { formatTimestampDate } from '@/domain/wedding-date';

export default function GuestEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveGuest, deleteGuest } = useApp();
  const theme = useAppTheme();
  const { t, locale } = useI18n();
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
      Alert.alert(t('guestEditor.saveFailed'), (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert(t('guestEditor.deleteTitle'), t('guestEditor.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => void deleteGuest(form.id).then(() => router.back()),
      },
    ]);
  }
  const adults = adultCount(form);
  const showChildWarning = data.profile.adultsOnly && form.childCount > 0;
  return (
    <Screen title={existing ? t('guestEditor.edit') : t('guestEditor.new')}>
      <Card>
        <TextField
          label={t('guestEditor.name')}
          value={form.name}
          onChangeText={(value) => update('name', value)}
          autoCapitalize="words"
          autoFocus
        />
        <TextField
          label={t('guestEditor.phone')}
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          keyboardType="phone-pad"
        />
        <TextField
          label={t('guestEditor.email')}
          value={form.email}
          onChangeText={(value) => update('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Chips<GuestSide>
          label={t('guestEditor.side')}
          value={form.side}
          onChange={(value) => update('side', value)}
          options={[
            { value: 'couple1', label: data.profile.couple1Name || t('guestEditor.side1') },
            { value: 'couple2', label: data.profile.couple2Name || t('guestEditor.side2') },
            { value: 'common', label: t('guestEditor.sideCommon') },
          ]}
        />
        <View style={styles.two}>
          <TextField
            label={t('guestEditor.partySize')}
            value={String(form.partySize)}
            onChangeText={(value) => update('partySize', Number.parseInt(value, 10) || 0)}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextField
            label={t('guestEditor.children')}
            value={String(form.childCount)}
            onChangeText={(value) => update('childCount', Number.parseInt(value, 10) || 0)}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('guestEditor.counts', { adults, children: form.childCount })}
        </AppText>
        {showChildWarning ? (
          <AppText variant="caption" color={theme.colors.warning}>
            {t('guestEditor.adultsOnlyWarning')}
          </AppText>
        ) : null}
        <Chips<RsvpStatus>
          label={t('guestEditor.rsvp')}
          value={form.rsvp}
          onChange={(value) => update('rsvp', value)}
          options={[
            { value: 'pending', label: rsvpLabel(t, 'pending') },
            { value: 'attending', label: rsvpLabel(t, 'attending') },
            { value: 'declined', label: rsvpLabel(t, 'declined') },
            { value: 'maybe', label: rsvpLabel(t, 'maybe') },
          ]}
        />
        {existing ? (
          <AppText variant="caption" color={theme.colors.muted}>
            {rsvpSourceLabel(t, existing.rsvpSource)}
            {existing.rsvpRespondedAt ? ` · ${formatTimestampDate(existing.rsvpRespondedAt, locale)}` : ''}
          </AppText>
        ) : null}
        <Chips<GuestGroup>
          label={t('guestEditor.group')}
          value={form.group}
          onChange={(value) => update('group', value)}
          options={[
            { value: 'family', label: t('guest.group.family') },
            { value: 'friends', label: t('guest.group.friends') },
            { value: 'work', label: t('guest.group.work') },
            { value: 'other', label: t('guest.group.other') },
          ]}
        />
        <TextField
          label={t('guestEditor.meal')}
          value={form.mealNotes}
          onChangeText={(value) => update('mealNotes', value)}
          multiline
        />
        <TextField
          label={t('guestEditor.notes')}
          value={form.notes}
          onChangeText={(value) => update('notes', value)}
          multiline
        />
        <View style={styles.actions}>
          <Button label={t('common.save')} onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? (
            <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} disabled={saving} />
          ) : null}
        </View>
      </Card>
      {existing ? (
        <Card>
          <AppText variant="label">{t('guestEditor.inviteSection')}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {inviteStatusLabel(t, existing.inviteStatus)}
            {existing.lastInviteChannel ? ` · ${inviteChannelLabel(t, existing.lastInviteChannel)}` : ''}
            {existing.lastInviteSentAt ? ` · ${formatTimestampDate(existing.lastInviteSentAt, locale)}` : ''}
          </AppText>
          <Button
            label={t('guestEditor.markSent')}
            variant="secondary"
            disabled={existing.inviteStatus === 'markedSent'}
            onPress={() => {
              const stamp = new Date().toISOString();
              void saveGuest(markInviteSent(existing, stamp)).then(() => router.back());
            }}
          />
          <Button
            label={t('guestEditor.resetSend')}
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
