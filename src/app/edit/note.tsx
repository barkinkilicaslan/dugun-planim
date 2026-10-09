import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import type { NoteItem } from '@/domain/models';

export default function NoteEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveNote, deleteNote } = useApp();
  const { t } = useI18n();
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
      Alert.alert(t('noteEditor.saveFailed'), (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert(t('noteEditor.deleteTitle'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteNote(form.id)
            .then(() => router.back())
            .catch((error) =>
              Alert.alert(t('common.deleteFailed'), error instanceof Error ? error.message : t('common.unknownError')),
            ),
      },
    ]);
  }
  return (
    <Screen title={existing ? t('noteEditor.edit') : t('noteEditor.new')}>
      <Card>
        <TextField
          label={t('noteEditor.title')}
          value={form.title}
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
          autoFocus
        />
        <TextField
          label={t('noteEditor.content')}
          value={form.content}
          onChangeText={(content) => setForm((current) => ({ ...current, content }))}
          multiline
          style={styles.content}
        />
        <View style={styles.actions}>
          <Button label={t('common.save')} onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} /> : null}
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
