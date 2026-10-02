import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { formatDate, formatMoney } from '@/domain/calculations';
import { formatMonthYear } from '@/domain/wedding-date';

type Mode = 'month' | 'list';

export default function CalendarScreen() {
  const { data } = useApp();
  const { t, locale, intl } = useI18n();
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
            detail: task.completed ? t('calendar.taskDone') : t('calendar.task'),
            href: `/edit/task?id=${task.id}` as const,
          })),
        ...data.budgetItems
          .filter((item) => item.dueDate)
          .map((item) => ({
            id: `b-${item.id}`,
            date: item.dueDate,
            title: item.title,
            detail: t('calendar.payment', {
              amount: formatMoney(Math.max(0, item.actualCents - item.paidCents), data.profile.currency, intl),
            }),
            href: `/edit/budget?id=${item.id}` as const,
          })),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    [data, intl, t],
  );
  const grouped = events.reduce((map, event) => {
    const month = event.date.slice(0, 7);
    map.set(month, [...(map.get(month) ?? []), event]);
    return map;
  }, new Map<string, typeof events>());

  return (
    <Screen title={t('nav.calendar')} subtitle={t('calendar.subtitle')}>
      <Chips<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'month', label: t('calendar.month') },
          { value: 'list', label: t('calendar.list') },
        ]}
      />
      {!events.length ? (
        <EmptyState title={t('calendar.emptyTitle')} description={t('calendar.emptyHint')} />
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
            <SectionHeader title={formatMonthYear(month, locale)} />
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
