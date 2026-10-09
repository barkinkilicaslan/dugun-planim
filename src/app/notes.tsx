import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { formatTimestampDate } from '@/domain/wedding-date';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
export default function NotesScreen() {
  const { data } = useApp();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const notes = data.notes
    .filter((note) =>
      `${note.title} ${note.content}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <Screen
      title={t('nav.notes')}
      subtitle={t('notes.subtitle', { count: data.notes.length })}
      action={<Button label={t('common.add')} onPress={() => router.push('/edit/note')} />}
    >
      <TextField
        label={t('notes.search')}
        value={search}
        onChangeText={setSearch}
        placeholder={t('notes.searchPlaceholder')}
      />
      {notes.length ? (
        <Card>
          {notes.map((note) => (
            <ListRow
              key={note.id}
              title={note.title}
              subtitle={note.content}
              meta={formatTimestampDate(note.updatedAt, locale)}
              accessibilityLabel={`${note.title}, ${note.content.replace(/\s+/g, ' ').trim().slice(0, 80)}, ${formatTimestampDate(note.updatedAt, locale)}`}
              onPress={() => router.push(`/edit/note?id=${note.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title={t('notes.notFound')}
          description={search ? t('common.searchTextHint') : t('notes.emptyHint')}
          actionLabel={t('notes.add')}
          onAction={() => router.push('/edit/note')}
        />
      )}
    </Screen>
  );
}
