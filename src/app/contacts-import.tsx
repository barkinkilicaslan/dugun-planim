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
import { useI18n } from '@/context/language-context';
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
  const { t } = useI18n();
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
      Alert.alert(t('contacts.loadFailedTitle'), t('contacts.loadFailedBody'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      Alert.alert(t('contacts.permissionFailedTitle'), t('contacts.permissionFailedBody'));
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
        t('contacts.resultTitle'),
        `${t('contacts.resultAdded', { count: added })}${merged ? t('contacts.resultMerged', { count: merged }) : ''}${skipped ? t('contacts.resultSkipped', { count: skipped }) : ''}.`,
        [{ text: t('common.ok'), onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(t('contacts.importFailed'), (error as Error).message);
    } finally {
      setImporting(false);
    }
  }

  const selectedCount = Object.keys(selected).length;

  if (access === undefined) return <Screen title={t('nav.contactsImport')} />;

  if (access === 'unavailable')
    return (
      <Screen title={t('nav.contactsImport')}>
        <Card>
          <AppText>{t('contacts.unavailable')}</AppText>
          <Button label={t('contacts.addManually')} onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  if (access === 'undetermined' || access === 'denied')
    return (
      <Screen title={t('nav.contactsImport')}>
        <Card>
          <AppText variant="subtitle">{t('contacts.introTitle')}</AppText>
          <AppText color={theme.colors.muted}>{t('contacts.introBody')}</AppText>
          <AppText color={theme.colors.muted}>{t('contacts.introBullets')}</AppText>
          {access === 'denied' ? <AppText color={theme.colors.warning}>{t('contacts.deniedNote')}</AppText> : null}
          <Button label={t('contacts.grant')} onPress={() => void grantAndLoad()} />
          <Button label={t('contacts.addManually')} variant="secondary" onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  if (access === 'blocked')
    return (
      <Screen title={t('nav.contactsImport')}>
        <Card>
          <AppText variant="subtitle">{t('contacts.blockedTitle')}</AppText>
          <AppText color={theme.colors.muted}>{t('contacts.blockedBody')}</AppText>
          <Button label={t('contacts.openSettings')} onPress={() => void Linking.openSettings()} />
          <Button label={t('contacts.addManually')} variant="secondary" onPress={() => router.replace('/edit/guest')} />
        </Card>
      </Screen>
    );

  return (
    <Screen title={t('nav.contactsImport')} subtitle={t('contacts.subtitle', { count: selectedCount })}>
      {access === 'limited' ? (
        <Card>
          <AppText variant="caption" color={theme.colors.muted}>
            {t('contacts.limitedNote')}
          </AppText>
          <Button
            label={t('contacts.shareMore')}
            variant="secondary"
            onPress={() => void presentLimitedAccessPicker().then(load)}
          />
        </Card>
      ) : null}
      <TextField
        label={t('contacts.search')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('contacts.searchPlaceholder')}
      />
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <AppText variant="label">{t('contacts.mergeTitle')}</AppText>
          <AppText variant="caption" color={theme.colors.muted}>
            {t('contacts.mergeBody')}
          </AppText>
        </View>
        <Switch
          accessibilityLabel={t('contacts.mergeTitle')}
          value={mergeDuplicates}
          onValueChange={setMergeDuplicates}
          trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
        />
      </View>
      {loading ? <AppText color={theme.colors.muted}>{t('contacts.loading')}</AppText> : null}
      {!loading && !filtered.length ? (
        <AppText color={theme.colors.muted}>
          {candidates.length ? t('contacts.noMatch') : t('contacts.noContacts')}
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
                accessibilityLabel={
                  isDuplicate ? t('contacts.a11yDuplicate', { name: candidate.name }) : candidate.name
                }
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
                    {isDuplicate ? t('contacts.alreadyListed') : ''}
                  </AppText>
                </View>
              </Pressable>
              {choice && candidate.phones.length > 1 ? (
                <Chips<string>
                  label={t('contacts.phoneChoice')}
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
                  label={t('contacts.emailChoice')}
                  value={choice.email}
                  onChange={(value) =>
                    setSelected((current) => ({ ...current, [candidate.id]: { ...choice, email: value } }))
                  }
                  options={[
                    ...candidate.emails.map((email) => ({ value: email.value, label: email.display })),
                    { value: NO_EMAIL, label: t('contacts.noEmail') },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </Card>
      {filtered.length > visible ? (
        <Button
          label={t('contacts.showMore')}
          variant="secondary"
          onPress={() => setVisible((current) => current + PAGE_SIZE)}
        />
      ) : null}
      <Button
        label={selectedCount ? t('contacts.importButton', { count: selectedCount }) : t('contacts.pick')}
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
