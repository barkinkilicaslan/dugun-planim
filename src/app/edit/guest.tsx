import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { Guest, GuestGroup, GuestSide, RsvpStatus } from '@/domain/models';

export default function GuestEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveGuest, deleteGuest } = useApp();
  const existing = data.guests.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<Guest>(
    existing ?? {
      id: createId(),
      name: '',
      phone: '',
      side: 'common',
      partySize: 1,
      childCount: 0,
      rsvp: 'pending',
      notes: '',
      mealNotes: '',
      group: 'other',
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
      await saveGuest({ ...form, updatedAt: new Date().toISOString() });
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
        <Chips<RsvpStatus>
          label="Davet durumu"
          value={form.rsvp}
          onChange={(value) => update('rsvp', value)}
          options={[
            { value: 'pending', label: 'Bekliyor' },
            { value: 'attending', label: 'Katılıyor' },
            { value: 'declined', label: 'Katılmıyor' },
          ]}
        />
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
    </Screen>
  );
}
const styles = StyleSheet.create({
  two: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  input: { minWidth: 130 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
});
