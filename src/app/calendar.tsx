import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useApp } from '@/context/app-context';
import { formatDate, formatMoney } from '@/domain/calculations';

type Mode = 'month' | 'list';

export default function CalendarScreen() {
  const { data } = useApp();
  const [mode, setMode] = useState<Mode>('month');
  const events = useMemo(
    () =>
      [
        ...data.tasks
          .filter((task) => task.dueDate)
          .map((task) => ({
            id: `t-${task.id}`,
            date: task.dueDate,
            title: task.title,
            detail: task.completed ? 'Görev · Tamamlandı' : 'Görev',
            href: `/edit/task?id=${task.id}` as const,
          })),
        ...data.budgetItems
          .filter((item) => item.dueDate)
          .map((item) => ({
            id: `b-${item.id}`,
            date: item.dueDate,
            title: item.title,
            detail: `Ödeme · ${formatMoney(Math.max(0, item.actualCents - item.paidCents), data.profile.currency)} kalan`,
            href: `/edit/budget?id=${item.id}` as const,
          })),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );
  const grouped = events.reduce((map, event) => {
    const month = event.date.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), event]);
    return map;
  }, new Map<string, typeof events>());

  return (
    <Screen title="Takvim" subtitle="Görev ve ödemeler birlikte">
      <Chips<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'month', label: 'Aylık' },
          { value: 'list', label: 'Liste' },
        ]}
      />
      {!events.length ? (
        <EmptyState title="Takvim boş" description="Tarihli görevler ve ödeme vadeleri burada birlikte görünür." />
      ) : mode === 'list' ? (
        <Card>
          {events.map((event) => (
            <ListRow
              key={event.id}
              title={event.title}
              subtitle={event.detail}
              meta={formatDate(event.date, data.profile.dateFormat)}
              onPress={() => router.push(event.href)}
            />
          ))}
        </Card>
      ) : (
        [...grouped.entries()].map(([month, monthEvents]) => (
          <Card key={month}>
            <SectionHeader
              title={new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
                new Date(`${month}-15T12:00:00`),
              )}
            />
            {monthEvents.map((event) => (
              <ListRow
                key={event.id}
                title={event.title}
                subtitle={event.detail}
                meta={event.date.slice(8)}
                onPress={() => router.push(event.href)}
              />
            ))}
          </Card>
        ))
      )}
    </Screen>
  );
}
