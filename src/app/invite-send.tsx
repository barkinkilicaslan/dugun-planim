import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, PixelRatio, Pressable, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ScaledInvitation } from '@/components/invitation/scaled-invitation';
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
  buildInviteMessage,
  createInvitationDesign,
  inviteSubject,
  invitationFileBase,
  resolveInvitationContent,
} from '@/domain/invitation-content';
import { paletteById, templateById, templateName } from '@/domain/invitation-templates';
import {
  availableChannels,
  channelNote,
  cancelQueue,
  createInviteQueue,
  currentEntry,
  queueFinished,
  queueSummary,
  resolveCurrent,
  type DeviceCapabilities,
  type InviteQueue,
} from '@/domain/invite-dispatch';
import type { Guest, InviteChannel } from '@/domain/models';
import { inviteChannelLabel, inviteStatusLabel, markInviteSent, recordInviteOpened } from '@/domain/rsvp';
import { renderInvitationPng, type GeneratedInvitationFile } from '@/services/invitation-files';
import {
  getDeviceCapabilities,
  sendInvite,
  shareInviteImage,
  shareInviteText,
  type SendOutcome,
} from '@/services/invite-sender';
import { preparePersonalInvitationFile } from '@/services/personal-invitations';
import { rsvpUrlForGuest } from '@/services/rsvp';

export default function InviteSendScreen() {
  const { designId, personalId } = useLocalSearchParams<{ designId?: string; personalId?: string }>();
  const { data, saveGuest } = useApp();
  const theme = useAppTheme();
  const i18n = useI18n();
  const { t, locale } = i18n;
  const { width: windowWidth } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const design = useMemo(
    () =>
      data.invitationDesigns.find((item) => item.id === designId) ??
      data.invitationDesigns.find((item) => item.isDefault) ??
      data.invitationDesigns[0],
    [data.invitationDesigns, designId],
  );
  // Yüklenen (kişisel) davetiye: mesaj metni profilden, görsel yüklenen dosyadan gelir.
  const personal = personalId ? data.personalInvitations.find((item) => item.id === personalId) : undefined;
  const activeDesign = personal ? createInvitationDesign(personal.id, 'classic', personal.createdAt, false, t) : design;
  const [device, setDevice] = useState<DeviceCapabilities>({ mail: false, sms: false });
  const [channel, setChannel] = useState<InviteChannel>('sms');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [attachImage, setAttachImage] = useState(true);
  const [queue, setQueue] = useState<InviteQueue>();
  const [attachment, setAttachment] = useState<GeneratedInvitationFile>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getDeviceCapabilities().then(setDevice);
  }, []);

  const content = activeDesign ? resolveInvitationContent(activeDesign, data.profile, i18n) : undefined;
  const guestById = (guestId: string): Guest | undefined => data.guests.find((guest) => guest.id === guestId);

  const guests = useMemo(
    () =>
      data.guests
        .filter((guest) => guest.name.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [data.guests, locale, search],
  );
  const chosen = data.guests.filter((guest) => selected[guest.id]);
  const availability = (guest: Guest) =>
    availableChannels(guest, device).find((item) => item.channel === channel)?.available ?? false;

  if (personalId && !personal)
    return (
      <Screen title={t('nav.inviteSend')}>
        <Card>
          <AppText>{t('personal.notFoundBody')}</AppText>
          <Button label={t('common.back')} onPress={() => router.back()} />
        </Card>
      </Screen>
    );

  if (!activeDesign || !content)
    return (
      <Screen title={t('nav.inviteSend')}>
        <Card>
          <AppText>{t('send.needDesign')}</AppText>
          <Button label={t('send.createDesign')} onPress={() => router.replace('/invitations')} />
        </Card>
      </Screen>
    );

  const template = templateById(activeDesign.templateId);
  const palette = paletteById(activeDesign.paletteId);

  /** Yüklenen davetiye JPG olabilir; e-posta notunda biçim belirtilmez. */
  function noteFor(selected: InviteChannel): string {
    return personal && selected === 'email' && attachImage
      ? t('personal.send.noteEmail')
      : channelNote(t, selected, attachImage);
  }

  async function messageFor(guest: Guest) {
    const rsvpUrl = await rsvpUrlForGuest(guest.id, {
      allowChildren: !data.profile.adultsOnly,
      deadline: activeDesign?.rsvpDeadline || undefined,
    });
    return {
      subject: inviteSubject(content!, t),
      body: buildInviteMessage(content!, { guestName: guest.name, rsvpUrl }, t),
      attachment: channel === 'email' ? attachment : undefined,
    };
  }

  async function start() {
    try {
      setBusy(true);
      let file: GeneratedInvitationFile | undefined;
      if ((channel === 'email' && attachImage) || channel === 'share') {
        file = personal
          ? await preparePersonalInvitationFile(personal)
          : await renderInvitationPng(cardRef, invitationFileBase(design!, t), PixelRatio.get());
      }
      setAttachment(file);
      const caps = await getDeviceCapabilities();
      setDevice(caps);
      setQueue(createInviteQueue(chosen, channel, caps));
    } catch (error) {
      Alert.alert(t('send.prepareFailed'), (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function record(guest: Guest, outcome: SendOutcome) {
    const now = new Date().toISOString();
    const opened = recordInviteOpened(guest, channel, now);
    await saveGuest(outcome === 'sent' ? markInviteSent(opened, now, channel) : opened);
  }

  async function openCurrent() {
    if (!queue) return;
    const entry = currentEntry(queue);
    const guest = entry ? guestById(entry.guestId) : undefined;
    if (!entry || !guest) return;
    try {
      setBusy(true);
      const message = await messageFor(guest);
      const outcome = await sendInvite(channel, guest, message);
      if (outcome === 'cancelled') return;
      if (outcome === 'unavailable') {
        offerShareFallback(guest);
        return;
      }
      await record(guest, outcome);
      setQueue((current) => (current ? resolveCurrent(current, 'opened') : current));
    } catch (error) {
      Alert.alert(t('send.openFailed'), (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function offerShareFallback(guest: Guest) {
    Alert.alert(
      t('send.fallbackTitle', { channel: inviteChannelLabel(t, channel) }),
      t('send.fallbackBody', { channel: inviteChannelLabel(t, channel) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('send.fallbackOpen'),
          onPress: () =>
            void (async () => {
              const message = await messageFor(guest);
              const outcome = await shareInviteText(message.subject, message.body);
              if (outcome === 'cancelled') return;
              await record(guest, outcome);
              setQueue((current) => (current ? resolveCurrent(current, 'opened') : current));
            })().catch((error: Error) => Alert.alert(t('send.shareFailed'), error.message)),
        },
      ],
    );
  }

  async function shareImageForCurrent() {
    if (!attachment) return;
    try {
      await shareInviteImage(attachment);
    } catch (error) {
      Alert.alert(t('send.imageShareFailed'), (error as Error).message);
    }
  }

  function skipCurrent() {
    setQueue((current) => (current ? resolveCurrent(current, 'skipped', 'dispatch.userSkipped') : current));
  }

  function cancel() {
    setQueue((current) => (current ? cancelQueue(current) : current));
  }

  async function markSent(guestId: string) {
    const guest = guestById(guestId);
    if (guest) await saveGuest(markInviteSent(guest, new Date().toISOString(), channel));
  }

  const entry = queue ? currentEntry(queue) : undefined;
  const currentGuest = entry ? guestById(entry.guestId) : undefined;
  const summary = queue ? queueSummary(queue) : undefined;
  const previewWidth = Math.min(windowWidth - spacing.lg * 2, 220);

  return (
    <Screen
      title={t('nav.inviteSend')}
      subtitle={
        personal
          ? t('personal.send.subtitle', { name: personal.name })
          : `${design!.name} · ${templateName(t, template.id)}`
      }
    >
      <View style={styles.preview}>
        {personal ? (
          <Image
            source={{ uri: personal.imageUri }}
            accessibilityRole="image"
            accessibilityLabel={t('personal.previewA11y', { name: personal.name })}
            resizeMode="contain"
            style={{
              width: previewWidth,
              aspectRatio: personal.width > 0 && personal.height > 0 ? personal.width / personal.height : 0.72,
            }}
          />
        ) : (
          <ScaledInvitation
            width={previewWidth}
            content={content}
            template={template}
            palette={palette}
            cardRef={cardRef}
          />
        )}
      </View>
      <Card>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('send.intro')}
        </AppText>
      </Card>

      {!queue ? (
        <>
          <Card>
            <Chips<InviteChannel>
              label={t('send.channel')}
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'sms', label: inviteChannelLabel(t, 'sms') },
                { value: 'whatsapp', label: inviteChannelLabel(t, 'whatsapp') },
                { value: 'email', label: inviteChannelLabel(t, 'email') },
                { value: 'share', label: inviteChannelLabel(t, 'share') },
              ]}
            />
            {channel === 'email' ? (
              <View style={styles.switchRow}>
                <AppText style={styles.switchCopy}>
                  {t(personal ? 'personal.send.attachImage' : 'send.attachImage')}
                </AppText>
                <Switch
                  accessibilityLabel={t('send.attachImageA11y')}
                  value={attachImage}
                  onValueChange={setAttachImage}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                />
              </View>
            ) : null}
            <AppText variant="caption" color={theme.colors.muted}>
              {noteFor(channel)}
            </AppText>
          </Card>
          <TextField label={t('send.search')} value={search} onChangeText={setSearch} />
          <View style={styles.row}>
            <Button
              label={t('send.selectAll')}
              variant="secondary"
              onPress={() =>
                setSelected(Object.fromEntries(guests.filter((g) => availability(g)).map((guest) => [guest.id, true])))
              }
              style={styles.grow}
            />
            <Button
              label={t('send.clearSelection')}
              variant="ghost"
              onPress={() => setSelected({})}
              style={styles.grow}
            />
          </View>
          <Card>
            {guests.map((guest) => {
              const status = availableChannels(guest, device).find((item) => item.channel === channel);
              const usable = Boolean(status?.available);
              return (
                <Pressable
                  key={guest.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(selected[guest.id]), disabled: !usable }}
                  accessibilityLabel={
                    usable || !status?.reason
                      ? guest.name
                      : t('send.unreachable', { name: guest.name, reason: t(status.reason) })
                  }
                  disabled={!usable}
                  onPress={() => setSelected((current) => ({ ...current, [guest.id]: !current[guest.id] }))}
                  style={[styles.guestRow, { borderBottomColor: theme.colors.border, opacity: usable ? 1 : 0.55 }]}
                >
                  <View
                    style={[
                      styles.box,
                      {
                        borderColor: selected[guest.id] ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected[guest.id] ? theme.colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {selected[guest.id] ? <AppText color={theme.colors.primaryText}>✓</AppText> : null}
                  </View>
                  <View style={styles.switchCopy}>
                    <AppText variant="label">{guest.name}</AppText>
                    <AppText variant="caption" color={usable ? theme.colors.muted : theme.colors.warning}>
                      {usable
                        ? guest.inviteStatus === 'none'
                          ? t('send.notSentYet')
                          : guest.lastInviteChannel
                            ? t('send.previously', { channel: inviteChannelLabel(t, guest.lastInviteChannel) })
                            : t('send.previouslyMarked')
                        : status?.reason
                          ? t(status.reason)
                          : ''}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </Card>
          <Button
            label={chosen.length ? t('send.startFor', { count: chosen.length }) : t('send.selectGuests')}
            onPress={() => void start()}
            disabled={!chosen.length}
            loading={busy}
          />
        </>
      ) : (
        <Card>
          {currentGuest && entry ? (
            <>
              <AppText variant="subtitle">
                {t('send.progress', {
                  name: currentGuest.name,
                  position: (summary?.opened ?? 0) + (summary?.skipped ?? 0) + 1,
                  total: queue.entries.length,
                })}
              </AppText>
              <AppText color={theme.colors.muted}>
                {t('send.willOpen', { channel: inviteChannelLabel(t, channel) })}
              </AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {noteFor(channel)}
              </AppText>
              <Button
                label={t('send.openScreen', { channel: inviteChannelLabel(t, channel) })}
                onPress={() => void openCurrent()}
                loading={busy}
              />
              {channel === 'share' && attachment ? (
                <Button label={t('send.shareImage')} variant="secondary" onPress={() => void shareImageForCurrent()} />
              ) : null}
              <Button label={t('send.skip')} variant="secondary" onPress={skipCurrent} disabled={busy} />
              <Button label={t('send.cancelQueue')} variant="ghost" onPress={cancel} disabled={busy} />
            </>
          ) : null}
          {queueFinished(queue) ? (
            <>
              <AppText variant="subtitle">{queue.cancelled ? t('send.cancelled') : t('send.finished')}</AppText>
              <AppText color={theme.colors.muted}>
                {t('send.summary', { opened: summary?.opened ?? 0, skipped: summary?.skipped ?? 0 })}
                {summary?.cancelled ? t('send.summaryCancelled', { count: summary.cancelled }) : ''}
              </AppText>
            </>
          ) : null}
          {queue.entries.map((item) => {
            const guest = guestById(item.guestId);
            return (
              <View key={item.guestId} style={[styles.guestRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.switchCopy}>
                  <AppText variant="label">{item.guestName}</AppText>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {item.state === 'opened'
                      ? guest?.inviteStatus === 'markedSent'
                        ? inviteStatusLabel(t, 'markedSent')
                        : inviteStatusLabel(t, 'opened')
                      : item.state === 'waiting'
                        ? t('send.stateWaiting')
                        : item.state === 'cancelled'
                          ? t('send.stateCancelled')
                          : item.reason
                            ? t(item.reason)
                            : t('send.stateSkipped')}
                  </AppText>
                </View>
                {item.state === 'opened' && guest?.inviteStatus !== 'markedSent' ? (
                  <Button
                    label={t('send.markSentButton')}
                    variant="ghost"
                    onPress={() => void markSent(item.guestId)}
                  />
                ) : null}
              </View>
            );
          })}
          {queueFinished(queue) ? <Button label={t('send.done')} onPress={() => router.back()} /> : null}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchCopy: { flex: 1, gap: 2 },
  guestRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
