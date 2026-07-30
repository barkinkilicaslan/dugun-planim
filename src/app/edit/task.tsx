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
import type { TaskItem, TaskPriority } from '@/domain/models';

export default function TaskEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveTask, deleteTask } = useApp();
  const theme = useAppTheme();
  const existing = data.tasks.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<TaskItem>(
    existing ?? {
      id: createId(),
      category: '',
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
  );
  const [reminder, setReminder] = useState(Boolean(existing?.notificationId));
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof TaskItem>(key: K, value: TaskItem[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    try {
      setSaving(true);
      await saveTask({ ...form, updatedAt: new Date().toISOString() }, reminder);
      router.back();
    } catch (error) {
      Alert.alert('Görev kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert('Görev silinsin mi?', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteTask(form.id).then(() => router.back()) },
    ]);
  }
  return (
    <Screen title={existing ? 'Görevi düzenle' : 'Yeni görev'}>
      <Card>
        <TextField label="Başlık" value={form.title} onChangeText={(value) => update('title', value)} autoFocus />
        <TextField
          label="Kategori"
          placeholder="Örn. Mekân"
          value={form.category}
          onChangeText={(value) => update('category', value)}
        />
        <TextField
          label="Açıklama"
          value={form.description}
          onChangeText={(value) => update('description', value)}
          multiline
        />
        <TextField
          label="Son tarih (YYYY-AA-GG)"
          value={form.dueDate}
          onChangeText={(value) => update('dueDate', value)}
          placeholder="2027-06-01"
          keyboardType="numbers-and-punctuation"
        />
        <Chips<TaskPriority>
          label="Öncelik"
          value={form.priority}
          onChange={(value) => update('priority', value)}
          options={[
            { value: 'low', label: 'Düşük' },
            { value: 'medium', label: 'Orta' },
            { value: 'high', label: 'Yüksek' },
          ]}
        />
        <Chips<'no' | 'yes'>
          label="Bir gün önce hatırlat"
          value={reminder ? 'yes' : 'no'}
          onChange={(value) => setReminder(value === 'yes')}
          options={[
            { value: 'no', label: 'Kapalı' },
            { value: 'yes', label: 'Açık' },
          ]}
        />
        {!data.profile.notificationsEnabled && reminder ? (
          <AppText variant="caption" color={theme.colors.warning}>
            Bildirim izni kapalı. Ayarlardan izin tercihlerini güncelledikten sonra hatırlatma kurulabilir.
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <Button label="Kaydet" onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} disabled={saving} /> : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: spacing.sm }, grow: { flex: 1 } });
