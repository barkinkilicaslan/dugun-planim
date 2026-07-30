import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import { daysUntil, formatDate, isTaskOverdue } from '@/domain/calculations';
import type { TaskPriority } from '@/domain/models';

type StatusFilter = 'all' | 'open' | 'completed' | 'overdue';
type PriorityFilter = 'all' | TaskPriority;
type DateFilter = 'all' | 'next30' | 'undated';

export default function TasksScreen() {
  const { data, saveTask } = useApp();
  const theme = useAppTheme();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => [...new Set(data.tasks.map((task) => task.category))].sort(), [data.tasks]);
  const filtered = useMemo(
    () =>
      data.tasks
        .filter((task) => {
          const match = `${task.title} ${task.description} ${task.category}`
            .toLocaleLowerCase('tr')
            .includes(search.toLocaleLowerCase('tr'));
          const days = task.dueDate ? daysUntil(task.dueDate) : undefined;
          return (
            match &&
            (priority === 'all' || task.priority === priority) &&
            (category === 'all' || task.category === category) &&
            (dateFilter === 'all' ||
              (dateFilter === 'undated' && !task.dueDate) ||
              (dateFilter === 'next30' && days !== undefined && days >= 0 && days <= 30)) &&
            (status === 'all' ||
              (status === 'open' && !task.completed) ||
              (status === 'completed' && task.completed) ||
              (status === 'overdue' && isTaskOverdue(task)))
          );
        })
        .sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate)),
    [category, data.tasks, dateFilter, priority, search, status],
  );

  async function toggle(id: string) {
    const task = data.tasks.find((item) => item.id === id);
    if (!task) return;
    try {
      await saveTask(
        { ...task, completed: !task.completed, updatedAt: new Date().toISOString() },
        Boolean(task.notificationId && task.completed),
      );
    } catch (error) {
      Alert.alert('Görev güncellenemedi', (error as Error).message);
    }
  }

  return (
    <Screen
      title="Görevler"
      subtitle={`${data.tasks.filter((task) => task.completed).length}/${data.tasks.length} tamamlandı`}
      action={<Button label="+ Ekle" onPress={() => router.push('/edit/task')} />}
    >
      <TextField
        label="Görev ara"
        placeholder="Başlık, açıklama veya kategori"
        value={search}
        onChangeText={setSearch}
      />
      <Chips<StatusFilter>
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'open', label: 'Açık' },
          { value: 'completed', label: 'Tamamlanan' },
          { value: 'overdue', label: 'Geciken' },
        ]}
      />
      <Chips<PriorityFilter>
        label="Öncelik"
        value={priority}
        onChange={setPriority}
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'high', label: 'Yüksek' },
          { value: 'medium', label: 'Orta' },
          { value: 'low', label: 'Düşük' },
        ]}
      />
      <Chips<DateFilter>
        label="Tarih"
        value={dateFilter}
        onChange={setDateFilter}
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'next30', label: '30 gün içinde' },
          { value: 'undated', label: 'Tarihsiz' },
        ]}
      />
      {categories.length ? (
        <Chips<string>
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={[{ value: 'all', label: 'Tümü' }, ...categories.map((value) => ({ value, label: value }))]}
        />
      ) : null}
      {filtered.length ? (
        filtered.map((task) => {
          const overdue = isTaskOverdue(task);
          return (
            <Card key={task.id} style={task.completed ? styles.completedCard : undefined}>
              <View style={styles.taskRow}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                  accessibilityLabel={`${task.title} tamamlandı olarak işaretle`}
                  onPress={() => void toggle(task.id)}
                  style={[
                    styles.check,
                    {
                      borderColor: task.completed ? theme.colors.success : theme.colors.border,
                      backgroundColor: task.completed ? theme.colors.success : 'transparent',
                    },
                  ]}
                >
                  <AppText color={task.completed ? '#fff' : theme.colors.muted}>{task.completed ? '✓' : ''}</AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${task.title} görevini düzenle`}
                  onPress={() => router.push(`/edit/task?id=${task.id}`)}
                  style={styles.copy}
                >
                  <View style={styles.titleRow}>
                    <AppText variant="label" style={task.completed ? styles.strike : undefined}>
                      {task.title}
                    </AppText>
                    {overdue ? (
                      <AppText variant="caption" color={theme.colors.danger}>
                        Gecikti
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {task.category} ·{' '}
                    {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'} öncelik
                    {task.dueDate ? ` · ${formatDate(task.dueDate, data.profile.dateFormat)}` : ''}
                  </AppText>
                  {task.description ? (
                    <AppText variant="caption" numberOfLines={2}>
                      {task.description}
                    </AppText>
                  ) : null}
                </Pressable>
              </View>
            </Card>
          );
        })
      ) : (
        <EmptyState
          title="Görev bulunamadı"
          description={
            search || status !== 'all' || priority !== 'all' || dateFilter !== 'all' || category !== 'all'
              ? 'Arama veya filtreyi değiştirin.'
              : 'İlk özel görevinizi ekleyin; ilerleme ana sayfaya yansır.'
          }
          actionLabel="Görev ekle"
          onAction={() => router.push('/edit/task')}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  check: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: spacing.xs, minHeight: 44 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  completedCard: { opacity: 0.68 },
  strike: { textDecorationLine: 'line-through' },
});
