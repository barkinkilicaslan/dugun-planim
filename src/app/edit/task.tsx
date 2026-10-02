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
import type { TaskItem, TaskPriority } from '@/domain/models';

export default function TaskEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveTask, deleteTask } = useApp();
  const theme = useAppTheme();
  const { t } = useI18n();
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
      Alert.alert(t('taskEditor.saveFailed'), (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert(t('taskEditor.deleteTitle'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => void deleteTask(form.id).then(() => router.back()),
      },
    ]);
  }
  return (
    <Screen title={existing ? t('taskEditor.edit') : t('taskEditor.new')}>
      <Card>
        <TextField
          label={t('taskEditor.title')}
          value={form.title}
          onChangeText={(value) => update('title', value)}
          autoFocus
        />
        <TextField
          label={t('taskEditor.category')}
          placeholder={t('taskEditor.categoryPlaceholder')}
          value={form.category}
          onChangeText={(value) => update('category', value)}
        />
        <TextField
          label={t('taskEditor.description')}
          value={form.description}
          onChangeText={(value) => update('description', value)}
          multiline
        />
        <TextField
          label={t('taskEditor.dueDate')}
          value={form.dueDate}
          onChangeText={(value) => update('dueDate', value)}
          placeholder={t('taskEditor.dueDatePlaceholder')}
          keyboardType="numbers-and-punctuation"
        />
        <Chips<TaskPriority>
          label={t('taskEditor.priority')}
          value={form.priority}
          onChange={(value) => update('priority', value)}
          options={[
            { value: 'low', label: t('common.priority.low') },
            { value: 'medium', label: t('common.priority.medium') },
            { value: 'high', label: t('common.priority.high') },
          ]}
        />
        <Chips<'no' | 'yes'>
          label={t('taskEditor.reminder')}
          value={reminder ? 'yes' : 'no'}
          onChange={(value) => setReminder(value === 'yes')}
          options={[
            { value: 'no', label: t('common.off') },
            { value: 'yes', label: t('common.on') },
          ]}
        />
        {!data.profile.notificationsEnabled && reminder ? (
          <AppText variant="caption" color={theme.colors.warning}>
            {t('taskEditor.notificationsOff')}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <Button label={t('common.save')} onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? (
            <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} disabled={saving} />
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: spacing.sm }, grow: { flex: 1 } });
