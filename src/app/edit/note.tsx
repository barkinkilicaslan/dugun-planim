import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { NoteItem } from '@/domain/models';

export default function NoteEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveNote, deleteNote } = useApp();
  const existing = data.notes.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<NoteItem>(
    existing ?? { id: createId(), title: '', content: '', createdAt: now, updatedAt: now },
  );
  const [saving, setSaving] = useState(false);
  async function submit() {
    try {
      setSaving(true);
      await saveNote({ ...form, updatedAt: new Date().toISOString() });
      router.back();
    } catch (error) {
      Alert.alert('Not kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert('Not silinsin mi?', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteNote(form.id).then(() => router.back()) },
    ]);
  }
  return (
    <Screen title={existing ? 'Notu düzenle' : 'Yeni not'}>
      <Card>
        <TextField
          label="Başlık"
          value={form.title}
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
          autoFocus
        />
        <TextField
          label="İçerik"
          value={form.content}
          onChangeText={(content) => setForm((current) => ({ ...current, content }))}
          multiline
          style={styles.content}
        />
        <View style={styles.actions}>
          <Button label="Kaydet" onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} /> : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { minHeight: 260 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
});
