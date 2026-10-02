import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import {
  contactMatchesQuery,
  findDuplicateGuest,
  mergeContactIntoGuest,
  planContactImport,
  type ContactCandidate,
  type ContactSelection,
} from '@/domain/contacts';
import type { Guest } from '@/domain/models';
import {
  getContactsAccess,
  loadContactCandidates,
  presentLimitedAccessPicker,
  requestContactsAccess,
  type ContactsAccess,
} from '@/services/contacts';

const PAGE_SIZE = 40;
const NO_EMAIL = 'none';

interface Choice {
  phone: string;
  email: string;
}

export default function ContactsImportScreen() {
  const { data, createId, saveGuest } = useApp();
  const theme = useAppTheme();
  const [access, setAccess] = useState<ContactsAccess>();
  const [candidates, setCandidates] = useState<ContactCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Record<string, Choice>>({});
  const [mergeDuplicates, setMergeDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCandidates(await loadContactCandidates());
    } catch {
      Alert.alert('Rehber okunamadı', 'Kişiler yüklenemedi. Lütfen tekrar deneyin veya davetliyi elle ekleyin.');
    } finally {
      setLoading(false);
    }
  }, []);

  // İzin zaten verilmişse açıklama ekranı atlanır; izin penceresi bu ekranda kullanıcı eylemi olmadan açılmaz.
  useEffect(() => {
    let active = true;
    void getContactsAccess().then((current) => {
      if (!active) return;
      setAccess(current);
      if (current === 'granted' || current === 'limited') void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function grantAndLoad() {
    try {
      const next = await requestContactsAccess();
      setAccess(next);
      if (next === 'granted' || next === 'limited') await load();
    } catch {
      Alert.alert('İzin istenemedi', 'Rehber izni şu an istenemedi. Davetlileri elle ekleyebilirsiniz.');
    }
  }

  const filtered = useMemo(
    () => candidates.filter((candidate) => contactMatchesQuery(candidate, query)),
    [candidates, query],
  );

  const duplicates = useMemo(() => {
    const result = new Set<string>();
    for (const candidate of candidates) {
      const hit =
        candidate.phones.some((phone) => findDuplicateGuest(data.guests, { phone: phone.display })) ||
        candidate.emails.some((email) => findDuplicateGuest(data.guests, { email: email.display }));
      if (hit) result.add(candidate.id);
    }
    return result;
  }, [candidates, data.guests]);

  function toggle(candidate: ContactCandidate) {
    setSelected((current) => {
      const next = { ...current };
      if (next[candidate.id]) delete next[candidate.id];
      else
        next[candidate.id] = { phone: candidate.phones[0]?.value ?? '', email: candidate.emails[0]?.value ?? NO_EMAIL };
      return next;
    });
  }

  function selectionsFor(): ContactSelection[] {
    return candidates.flatMap((candidate) => {
      const choice = selected[candidate.id];
      if (!choice) return [];
      return [
        {
          candidate,
          phone: candidate.phones.find((phone) => phone.value === choice.phone),
          email: candidate.emails.find((email) => email.value === choice.email),
        },
      ];
    });
  }

  async function importSelected() {
    try {
      setImporting(true);
      const plan = planContactImport(data.guests, selectionsFor(), mergeDuplicates);
      const now = new Date().toISOString();
      let added = 0;
      let merged = 0;
      let skipped = 0;
      for (const outcome of plan) {
        if (outcome.kind === 'add') {
          const guest: Guest = {
            id: createId(),
            name: outcome.name,
            phone: outcome.phone,
            email: outcome.email,
            side: 'common',
            partySize: 1,
            childCount: 0,
            rsvp: 'pending',
            notes: '',
            mealNotes: '',
            group: 'other',
            rsvpSource: 'none',
            rsvpRespondedAt: '',
            lastInviteSentAt: '',
            lastInviteChannel: '',
            inviteStatus: 'none',
            createdAt: now,
            updatedAt: now,
          };
          await saveGuest(guest);
          added += 1;
        } else if (outcome.kind === 'merge') {
          const existing = data.guests.find((guest) => guest.id === outcome.guestId);
          if (existing) {
            const next = mergeContactIntoGuest(existing, { phone: outcome.phone, email: outcome.email }, now);
            if (next !== existing) await saveGuest(next);
            merged += 1;
          }
        } else skipped += 1;
      }
      Alert.alert(
        'Rehberden ekleme tamamlandı',
        `${added} davetli eklendi${merged ? `, ${merged} kayıt birleştirildi` : ''}${skipped ? `, ${skipped} kişi zaten listede olduğu için atlandı` : ''}.`,
        [{ text: 'Tamam', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert('Davetliler eklenemedi', (error as Error).message);
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = Object.keys(selected).length;

  if (access === undefined) return <Screen title="Rehberden davetli ekle" />;

  if (access === 'unavailable')
    return (
      <Screen title="Rehberden davetli ekle">
        <Card>
          <AppText>
            Rehber erişimi yalnız iOS ve Android uygulamasında kullanılabilir. Davetlileri elle ekleyebilirsiniz.
          </AppText>
          <Button label="Davetliyi elle ekle" onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  if (access === 'undetermined' || access === 'denied')
    return (
      <Screen title="Rehberden davetli ekle">
        <Card>
          <AppText variant="subtitle">Kişilerinize neden erişiyoruz?</AppText>
          <AppText color={theme.colors.muted}>
            Davetlilerinizi tek tek yazmak yerine telefonunuzdaki Kişiler listesinden seçebilmeniz için rehbere okuma
            erişimi isteriz.
          </AppText>
          <AppText color={theme.colors.muted}>
            • Yalnızca sizin seçtiğiniz kişilerin ad, telefon ve e-posta bilgisi davetli listenize kaydedilir.{'\n'}•
            Rehberin tamamı veritabanına kopyalanmaz.{'\n'}• Hiçbir rehber bilgisi sunucuya gönderilmez.{'\n'}• İzin
            vermezseniz davetlileri elle eklemeye devam edebilirsiniz.
          </AppText>
          {access === 'denied' ? (
            <AppText color={theme.colors.warning}>
              Daha önce izin verilmedi. İsterseniz tekrar deneyebilirsiniz.
            </AppText>
          ) : null}
          <Button label="Devam et ve izin ver" onPress={() => void grantAndLoad()} />
          <Button label="Davetliyi elle ekle" variant="secondary" onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  if (access === 'blocked')
    return (
      <Screen title="Rehberden davetli ekle">
        <Card>
          <AppText variant="subtitle">Rehber izni kapalı</AppText>
          <AppText color={theme.colors.muted}>
            Rehber erişimini cihaz ayarlarından açabilirsiniz. Uygulama izin olmadan da çalışır; davetlileri elle
            ekleyebilirsiniz.
          </AppText>
          <Button label="Ayarları aç" onPress={() => void Linking.openSettings()} />
          <Button label="Davetliyi elle ekle" variant="secondary" onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  return (
    <Screen title="Rehberden davetli ekle" subtitle={`${selectedCount} kişi seçildi`}>
      {access === 'limited' ? (
        <Card>
          <AppText variant="caption" color={theme.colors.muted}>
            Yalnızca paylaştığınız kişilere erişiliyor.
          </AppText>
          <Button
            label="Daha fazla kişi paylaş"
            variant="secondary"
            onPress={() => void presentLimitedAccessPicker().then(load)}
          />
        </Card>
      ) : null}
      <TextField label="Kişi ara" value={query} onChangeText={setQuery} placeholder="Ad, telefon veya e-posta" />
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <AppText variant="label">Mevcut davetlilerle birleştir</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            Açıkken listede zaten olan kişilerin eksik telefon/e-posta bilgisi tamamlanır; kapalıyken atlanırlar.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Mevcut davetlilerle birleştir"
          value={mergeDuplicates}
          onValueChange={setMergeDuplicates}
          trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        />
      </View>
      {loading ? <AppText color={theme.colors.muted}>Kişiler yükleniyor…</AppText> : null}
      {!loading && !filtered.length ? (
        <AppText color={theme.colors.muted}>
          {candidates.length ? 'Aramanızla eşleşen kişi yok.' : 'Telefon veya e-posta bilgisi olan kişi bulunamadı.'}
        </AppText>
      ) : null}
      <Card>
        {filtered.slice(0, visible).map((candidate) => {
          const choice = selected[candidate.id];
          const isDuplicate = duplicates.has(candidate.id);
          return (
            <View key={candidate.id} style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: Boolean(choice) }}
                accessibilityLabel={`${candidate.name}${isDuplicate ? ', zaten davetli listesinde' : ''}`}
                onPress={() => toggle(candidate)}
                style={styles.rowMain}
              >
                <View
                  style={[
                    styles.box,
                    {
                      borderColor: choice ? theme.colors.primary : theme.colors.border,
                      backgroundColor: choice ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {choice ? <AppText color={theme.colors.primaryText}>✓</AppText> : null}
                </View>
                <View style={styles.rowCopy}>
                  <AppText variant="label">{candidate.name}</AppText>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {[candidate.phones[0]?.display, candidate.emails[0]?.display].filter(Boolean).join(' · ')}
                    {isDuplicate ? ' · Zaten listede' : ''}
                  </AppText>
                </View>
              </Pressable>
              {choice && candidate.phones.length > 1 ? (
                <Chips<string>
                  label="Telefon"
                  value={choice.phone}
                  onChange={(value) =>
                    setSelected((current) => ({ ...current, [candidate.id]: { ...choice, phone: value } }))
                  }
                  options={candidate.phones.map((phone) => ({
                    value: phone.value,
                    label: phone.label ? `${phone.display} (${phone.label})` : phone.display,
                  }))}
                />
              ) : null}
              {choice && candidate.emails.length > 1 ? (
                <Chips<string>
                  label="E-posta"
                  value={choice.email}
                  onChange={(value) =>
                    setSelected((current) => ({ ...current, [candidate.id]: { ...choice, email: value } }))
                  }
                  options={[
                    ...candidate.emails.map((email) => ({ value: email.value, label: email.display })),
                    { value: NO_EMAIL, label: 'E-posta ekleme' },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </Card>
      {filtered.length > visible ? (
        <Button
          label="Daha fazla göster"
          variant="secondary"
          onPress={() => setVisible((current) => current + PAGE_SIZE)}
        />
      ) : null}
      <Button
        label={selectedCount ? `${selectedCount} kişiyi davetli olarak ekle` : 'Kişi seçin'}
        onPress={() => void importSelected()}
        disabled={!selectedCount}
        loading={importing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchCopy: { flex: 1, gap: 2 },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: spacing.sm, gap: spacing.sm },
  rowMain: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowCopy: { flex: 1, gap: 2 },
  box: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
