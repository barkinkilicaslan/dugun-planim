import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { translate, type MessageKey, type SupportedLocale } from '@/i18n';
import { TASK_SUGGESTIONS, type TaskSuggestionCategory } from '@/domain/task-suggestions';
import type { TaskItem } from '@/domain/models';

const categories: TaskSuggestionCategory[] = [
  'planning',
  'budget',
  'venue',
  'guests',
  'vendors',
  'ceremony',
  'style',
  'food',
  'media',
  'logistics',
  'weddingDay',
  'after',
];
function categoryLabel(locale: SupportedLocale, category: TaskSuggestionCategory): string {
  const keys: Record<TaskSuggestionCategory, MessageKey> = {
    planning: 'tasks.suggestionCategory.planning',
    budget: 'tasks.suggestionCategory.budget',
    venue: 'tasks.suggestionCategory.venue',
    guests: 'tasks.suggestionCategory.guests',
    vendors: 'tasks.suggestionCategory.vendors',
    ceremony: 'tasks.suggestionCategory.ceremony',
    style: 'tasks.suggestionCategory.style',
    food: 'tasks.suggestionCategory.food',
    media: 'tasks.suggestionCategory.media',
    logistics: 'tasks.suggestionCategory.logistics',
    weddingDay: 'tasks.suggestionCategory.weddingDay',
    after: 'tasks.suggestionCategory.after',
  };
  return translate(locale, keys[category]);
}

export default function TaskSuggestionsScreen() {
  const { data, createId, saveTask } = useApp();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | TaskSuggestionCategory>('all');
  const [saving, setSaving] = useState<string>();
  const added = useMemo(() => new Set(data.tasks.map((task) => task.suggestionId).filter(Boolean)), [data.tasks]);
  const visible = TASK_SUGGESTIONS.filter((item) => {
    const text = `${locale === 'tr' ? item.title : item.titleEn} ${locale === 'tr' ? item.description : item.descriptionEn}`;
    return (
      (category === 'all' || category === item.category) &&
      text.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))
    );
  });
  async function add(item: (typeof TASK_SUGGESTIONS)[number]) {
    if (added.has(item.id)) return;
    const now = new Date().toISOString();
    const task: TaskItem = {
      id: createId(),
      suggestionId: item.id,
      category: categoryLabel(locale, item.category),
      title: locale === 'tr' ? item.title : item.titleEn,
      description: locale === 'tr' ? item.description : item.descriptionEn,
      dueDate: '',
      priority: item.priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    try {
      setSaving(item.id);
      await saveTask(task);
    } catch (error) {
      Alert.alert(t('tasks.updateFailed'), (error as Error).message);
    } finally {
      setSaving(undefined);
    }
  }

  return (
    <Screen title={t('tasks.suggestions')} subtitle={t('tasks.suggestionsHint')}>
      <TextField
        label={t('tasks.suggestionSearch')}
        placeholder={t('tasks.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />
      <Chips<'all' | TaskSuggestionCategory>
        value={category}
        onChange={setCategory}
        options={[
          { value: 'all', label: t('common.all') },
          ...categories.map((value) => ({ value, label: categoryLabel(locale, value) })),
        ]}
      />
      <AppText variant="caption">{t('tasks.suggestionCount', { count: visible.length })}</AppText>
      {visible.map((item) => {
        const isAdded = added.has(item.id);
        return (
          <Card key={item.id}>
            <AppText variant="caption">{categoryLabel(locale, item.category)}</AppText>
            <AppText variant="label">{locale === 'tr' ? item.title : item.titleEn}</AppText>
            <AppText variant="caption">{locale === 'tr' ? item.description : item.descriptionEn}</AppText>
            <View style={styles.action}>
              <Button
                label={isAdded ? t('tasks.suggestionAdded') : t('tasks.suggestionAdd')}
                disabled={isAdded || Boolean(saving)}
                onPress={() => void add(item)}
                loading={saving === item.id}
                style={styles.button}
              />
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { flexDirection: 'row', justifyContent: 'flex-end' },
  button: { minWidth: 160, paddingHorizontal: spacing.md },
});
