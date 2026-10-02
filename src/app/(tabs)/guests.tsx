import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { MetricCard, MetricGrid } from '@/components/ui/metric-card';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { guestSummary } from '@/domain/calculations';
import { csvToGuests, guestsToCsv } from '@/domain/csv';
import { inviteChannelLabel, matchesRsvpFilter, rsvpLabel, rsvpSummary, type RsvpFilter } from '@/domain/rsvp';
import { pickTextFile, shareTextFile } from '@/services/export';

type GuestFilter = RsvpFilter;
type GuestSort = 'name' | 'partySize';

export default function GuestsScreen() {
  const { data, createId, saveGuest } = useApp();
  const theme = useAppTheme();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GuestFilter>('all');
  const [sort, setSort] = useState<GuestSort>('name');
  const summary = guestSummary(data.guests);
  const rsvp = rsvpSummary(data.guests);
  const filtered = useMemo(
    () =>
      data.guests
        .filter(
          (guest) =>
            guest.name.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)) &&
            matchesRsvpFilter(guest, filter),
        )
        .sort((a, b) =>
          sort === 'partySize'
            ? b.partySize - a.partySize || a.name.localeCompare(b.name, locale)
            : a.name.localeCompare(b.name, locale),
        ),
    [data.guests, filter, locale, search, sort],
  );
  async function importCsv() {
    try {
      const raw = await pickTextFile(['text/csv', 'text/comma-separated-values']);
      if (!raw) return;
      const guests = csvToGuests(raw, createId);
      for (const guest of guests) await saveGuest(guest);
      Alert.alert(t('guests.importDone'), t('guests.imported', { count: guests.length }));
    } catch (error) {
      Alert.alert(t('guests.importFailed'), (error as Error).message);
    }
  }
  async function exportCsv() {
    try {
      await shareTextFile(t('guests.csvFile'), guestsToCsv(data.guests), 'text/csv');
    } catch (error) {
      Alert.alert(t('guests.exportFailed'), (error as Error).message);
    }
  }
  return (
    <Screen
      title={t('tabs.guests')}
      subtitle={t('guests.subtitle', { invitations: summary.invitations, people: summary.people })}
      action={<Button label={t('common.add')} onPress={() => router.push('/edit/guest')} />}
    >
      <MetricGrid>
        <MetricCard label={rsvpLabel(t, 'attending')} value={String(summary.attending)} tone="success" />
        <MetricCard label={rsvpLabel(t, 'pending')} value={String(summary.pending)} />
        <MetricCard label={rsvpLabel(t, 'maybe')} value={String(summary.maybe)} />
        <MetricCard label={rsvpLabel(t, 'declined')} value={String(summary.declined)} />
      </MetricGrid>
      {rsvp.invitations ? (
        <Card>
          <AppText variant="label">{t('guests.summaryTitle')}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {t('guests.summaryBody', {
              responded: rsvp.responded,
              invitations: rsvp.invitations,
              adults: rsvp.attendingAdults,
              children: rsvp.attendingChildren,
              sent: rsvp.invitesSent,
            })}
          </AppText>
        </Card>
      ) : null}
      <TextField
        label={t('guests.search')}
        value={search}
        onChangeText={setSearch}
        placeholder={t('guests.searchPlaceholder')}
      />
      <Chips<GuestFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('common.all') },
          { value: 'pending', label: t('guests.filterPending', { count: rsvp.pending }) },
          { value: 'attending', label: t('guests.filterAttending', { count: rsvp.attending }) },
          { value: 'maybe', label: t('guests.filterMaybe', { count: rsvp.maybe }) },
          { value: 'declined', label: t('guests.filterDeclined', { count: rsvp.declined }) },
          ...(rsvp.fromOnline
            ? [{ value: 'online' as const, label: t('guests.filterOnline', { count: rsvp.fromOnline }) }]
            : []),
        ]}
      />
      <Chips<GuestSort>
        label={t('guests.sort')}
        value={sort}
        onChange={setSort}
        options={[
          { value: 'name', label: t('guests.sortName') },
          { value: 'partySize', label: t('guests.sortParty') },
        ]}
      />
      <View style={styles.actions}>
        <Button
          label={t('guests.addFromContacts')}
          variant="secondary"
          onPress={() => router.push('/contacts-import')}
          style={styles.grow}
        />
        <Button
          label={t('guests.sendInvitations')}
          onPress={() => router.push('/invite-send')}
          disabled={!data.guests.length}
          style={styles.grow}
        />
      </View>
      <View style={styles.actions}>
        <Button
          label={t('guests.importCsv')}
          variant="secondary"
          onPress={() => void importCsv()}
          style={styles.grow}
        />
        <Button
          label={t('guests.exportCsv')}
          variant="ghost"
          onPress={() => void exportCsv()}
          disabled={!data.guests.length}
          style={styles.grow}
        />
      </View>
      {filtered.length ? (
        <Card>
          {filtered.map((guest) => (
            <ListRow
              key={guest.id}
              title={guest.name}
              subtitle={`${t(`guest.group.${guest.group}`)} · ${t('common.person', { count: guest.partySize })}${guest.childCount ? ` · ${t('common.children', { count: guest.childCount })}` : ''}${guest.lastInviteChannel ? ` · ${inviteChannelLabel(t, guest.lastInviteChannel)}` : ''}`}
              meta={rsvpLabel(t, guest.rsvp)}
              onPress={() => router.push(`/edit/guest?id=${guest.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title={t('guests.emptyTitle')}
          description={search || filter !== 'all' ? t('common.searchChangeHint') : t('guests.emptyHint')}
          actionLabel={t('guests.addGuest')}
          onAction={() => router.push('/edit/guest')}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flexGrow: 1 },
});
