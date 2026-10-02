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
import { useAppTheme } from '@/context/theme-context';
import { guestSummary } from '@/domain/calculations';
import { csvToGuests, guestsToCsv } from '@/domain/csv';
import { INVITE_CHANNEL_LABELS, matchesRsvpFilter, RSVP_LABELS, rsvpSummary, type RsvpFilter } from '@/domain/rsvp';
import { pickTextFile, shareTextFile } from '@/services/export';

type GuestFilter = RsvpFilter;
type GuestSort = 'name' | 'partySize';

export default function GuestsScreen() {
  const { data, createId, saveGuest } = useApp();
  const theme = useAppTheme();
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
            guest.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')) &&
            matchesRsvpFilter(guest, filter),
        )
        .sort((a, b) =>
          sort === 'partySize'
            ? b.partySize - a.partySize || a.name.localeCompare(b.name, 'tr')
            : a.name.localeCompare(b.name, 'tr'),
        ),
    [data.guests, filter, search, sort],
  );
  async function importCsv() {
    try {
      const raw = await pickTextFile(['text/csv', 'text/comma-separated-values']);
      if (!raw) return;
      const guests = csvToGuests(raw, createId);
      for (const guest of guests) await saveGuest(guest);
      Alert.alert('İçe aktarma tamamlandı', `${guests.length} davetli eklendi.`);
    } catch (error) {
      Alert.alert('CSV içe aktarılamadı', (error as Error).message);
    }
  }
  async function exportCsv() {
    try {
      await shareTextFile('dugun-planim-davetliler.csv', guestsToCsv(data.guests), 'text/csv');
    } catch (error) {
      Alert.alert('CSV dışa aktarılamadı', (error as Error).message);
    }
  }
  return (
    <Screen
      title="Davetliler"
      subtitle={`${summary.invitations} davet · ${summary.people} kişi`}
      action={<Button label="+ Ekle" onPress={() => router.push('/edit/guest')} />}
    >
      <MetricGrid>
        <MetricCard label="Katılıyor" value={String(summary.attending)} tone="success" />
        <MetricCard label="Yanıt bekleniyor" value={String(summary.pending)} />
        <MetricCard label="Belki" value={String(summary.maybe)} />
        <MetricCard label="Katılmıyor" value={String(summary.declined)} />
      </MetricGrid>
      {rsvp.invitations ? (
        <Card>
          <AppText variant="label">Katılım özeti</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {rsvp.responded}/{rsvp.invitations} davet yanıtlandı · Katılan {rsvp.attendingAdults} yetişkin,{' '}
            {rsvp.attendingChildren} çocuk · {rsvp.invitesSent} davetiye gönderim ekranı açıldı veya işaretlendi
          </AppText>
        </Card>
      ) : null}
      <TextField label="Davetli ara" value={search} onChangeText={setSearch} placeholder="Ada göre ara" />
      <Chips<GuestFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'pending', label: `Bekleyen (${rsvp.pending})` },
          { value: 'attending', label: `Katılıyor (${rsvp.attending})` },
          { value: 'maybe', label: `Belki (${rsvp.maybe})` },
          { value: 'declined', label: `Katılmıyor (${rsvp.declined})` },
          ...(rsvp.fromOnline ? [{ value: 'online' as const, label: `Çevrimiçi yanıt (${rsvp.fromOnline})` }] : []),
        ]}
      />
      <Chips<GuestSort>
        label="Sıralama"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'name', label: 'Ada göre' },
          { value: 'partySize', label: 'Kişi sayısına göre' },
        ]}
      />
      <View style={styles.actions}>
        <Button
          label="Rehberden davetli ekle"
          variant="secondary"
          onPress={() => router.push('/contacts-import')}
          style={styles.grow}
        />
        <Button
          label="Davetiye gönder"
          onPress={() => router.push('/invite-send')}
          disabled={!data.guests.length}
          style={styles.grow}
        />
      </View>
      <View style={styles.actions}>
        <Button label="CSV içe aktar" variant="secondary" onPress={() => void importCsv()} style={styles.grow} />
        <Button
          label="CSV dışa aktar"
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
              subtitle={`${guest.group === 'family' ? 'Aile' : guest.group === 'friends' ? 'Arkadaş' : guest.group === 'work' ? 'İş' : 'Diğer'} · ${guest.partySize} kişi${guest.childCount ? ` · ${guest.childCount} çocuk` : ''}${guest.lastInviteChannel ? ` · ${INVITE_CHANNEL_LABELS[guest.lastInviteChannel]}` : ''}`}
              meta={RSVP_LABELS[guest.rsvp]}
              onPress={() => router.push(`/edit/guest?id=${guest.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Davetli bulunamadı"
          description={
            search || filter !== 'all'
              ? 'Arama veya filtreyi değiştirin.'
              : 'Davetlileri tek tek veya doğrulanmış CSV dosyasıyla ekleyin.'
          }
          actionLabel="Davetli ekle"
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
