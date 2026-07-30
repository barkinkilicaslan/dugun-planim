import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useApp } from '@/context/app-context';
export default function NotesScreen() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const notes = data.notes
    .filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <Screen
      title="Notlar"
      subtitle={`${data.notes.length} not`}
      action={<Button label="+ Ekle" onPress={() => router.push('/edit/note')} />}
    >
      <TextField label="Not ara" value={search} onChangeText={setSearch} placeholder="Başlık veya içerik" />
      {notes.length ? (
        <Card>
          {notes.map((note) => (
            <ListRow
              key={note.id}
              title={note.title}
              subtitle={note.content}
              meta={new Date(note.updatedAt).toLocaleDateString('tr-TR')}
              onPress={() => router.push(`/edit/note?id=${note.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Not bulunamadı"
          description={search ? 'Arama metnini değiştirin.' : 'Fikir, soru ve önemli ayrıntıları cihazınızda saklayın.'}
          actionLabel="Not ekle"
          onAction={() => router.push('/edit/note')}
        />
      )}
    </Screen>
  );
}
