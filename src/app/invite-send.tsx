import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, PixelRatio, Pressable, StyleSheet, Switch, View, useWindowDimensions } from 'react-native';
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
import { useAppTheme } from '@/context/theme-context';
import {
  buildInviteMessage,
  inviteSubject,
  invitationFileBase,
  resolveInvitationContent,
} from '@/domain/invitation-content';
import { paletteById, templateById } from '@/domain/invitation-templates';
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
import { INVITE_CHANNEL_LABELS, markInviteSent, recordInviteOpened } from '@/domain/rsvp';
import { renderInvitationPng, type GeneratedInvitationFile } from '@/services/invitation-files';
import {
  getDeviceCapabilities,
  sendInvite,
  shareInviteImage,
  shareInviteText,
  type SendOutcome,
} from '@/services/invite-sender';
import { rsvpUrlForGuest } from '@/services/rsvp';

export default function InviteSendScreen() {
  const { designId } = useLocalSearchParams<{ designId?: string }>();
  const { data, saveGuest } = useApp();
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const cardRef = useRef<View>(null);

  const design = useMemo(
    () =>
      data.invitationDesigns.find((item) => item.id === designId) ??
      data.invitationDesigns.find((item) => item.isDefault) ??
      data.invitationDesigns[0],
    [data.invitationDesigns, designId],
  );
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

  const content = design ? resolveInvitationContent(design, data.profile) : undefined;
  const guestById = (guestId: string): Guest | undefined => data.guests.find((guest) => guest.id === guestId);

  const guests = useMemo(
    () =>
      data.guests
        .filter((guest) => guest.name.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))
        .sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [data.guests, search],
  );
  const chosen = data.guests.filter((guest) => selected[guest.id]);
  const availability = (guest: Guest) =>
    availableChannels(guest, device).find((item) => item.channel === channel)?.available ?? false;

  if (!design || !content)
    return (
      <Screen title="Davetiye gönder">
        <Card>
          <AppText>Göndermek için önce bir davetiye tasarımı oluşturun.</AppText>
          <Button label="Davetiye tasarla" onPress={() => router.replace('/invitations')} />
        </Card>
      </Screen>
    );

  const template = templateById(design.templateId);
  const palette = paletteById(design.paletteId);

  async function messageFor(guest: Guest) {
    const rsvpUrl = await rsvpUrlForGuest(guest.id, {
      allowChildren: !data.profile.adultsOnly,
      deadline: design?.rsvpDeadline || undefined,
    });
    return {
      subject: inviteSubject(content!),
      body: buildInviteMessage(content!, { guestName: guest.name, rsvpUrl }),
      attachment: channel === 'email' ? attachment : undefined,
    };
  }

  async function start() {
    try {
      setBusy(true);
      let file: GeneratedInvitationFile | undefined;
      if ((channel === 'email' && attachImage) || channel === 'share') {
        file = await renderInvitationPng(cardRef, invitationFileBase(design!), PixelRatio.get());
      }
      setAttachment(file);
      const caps = await getDeviceCapabilities();
      setDevice(caps);
      setQueue(createInviteQueue(chosen, channel, caps));
    } catch (error) {
      Alert.alert('Davetiye hazırlanamadı', (error as Error).message);
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
      Alert.alert('Gönderim ekranı açılamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function offerShareFallback(guest: Guest) {
    Alert.alert(
      `${INVITE_CHANNEL_LABELS[channel]} açılamadı`,
      `${INVITE_CHANNEL_LABELS[channel]} bu cihazda bulunamadı veya açılamadı. Davetiyeyi genel paylaşım menüsüyle gönderebilirsiniz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Paylaşım menüsünü aç',
          onPress: () =>
            void (async () => {
              const message = await messageFor(guest);
              const outcome = await shareInviteText(message.subject, message.body);
              if (outcome === 'cancelled') return;
              await record(guest, outcome);
              setQueue((current) => (current ? resolveCurrent(current, 'opened') : current));
            })().catch((error: Error) => Alert.alert('Paylaşım açılamadı', error.message)),
        },
      ],
    );
  }

  async function shareImageForCurrent() {
    if (!attachment) return;
    try {
      await shareInviteImage(attachment);
    } catch (error) {
      Alert.alert('Görsel paylaşılamadı', (error as Error).message);
    }
  }

  function skipCurrent() {
    setQueue((current) => (current ? resolveCurrent(current, 'skipped', 'Kullanıcı atladı.') : current));
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
    <Screen title="Davetiye gönder" subtitle={`${design.name} · ${template.name}`}>
      <View style={styles.preview}>
        <ScaledInvitation
          width={previewWidth}
          content={content}
          template={template}
          palette={palette}
          cardRef={cardRef}
        />
      </View>
      <Card>
        <AppText variant="caption" color={theme.colors.muted}>
          Uygulama hiçbir mesajı kendisi göndermez. Her adımda işletim sisteminin e-posta, SMS, WhatsApp veya paylaşım
          ekranı açılır ve göndermeyi siz onaylarsınız. Gönderim sonucu çoğu zaman doğrulanamadığı için durum “Gönderim
          ekranı açıldı” olarak kaydedilir; isterseniz “Gönderildi olarak işaretle” diyebilirsiniz.
        </AppText>
      </Card>

      {!queue ? (
        <>
          <Card>
            <Chips<InviteChannel>
              label="Kanal"
              value={channel}
              onChange={setChannel}
              options={[
                { value: 'sms', label: 'SMS' },
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'email', label: 'E-posta' },
                { value: 'share', label: 'Paylaşım menüsü' },
              ]}
            />
            {channel === 'email' ? (
              <View style={styles.switchRow}>
                <AppText style={styles.switchCopy}>Davetiye görselini (PNG) ekle</AppText>
                <Switch
                  accessibilityLabel="Davetiye görselini PNG olarak ekle"
                  value={attachImage}
                  onValueChange={setAttachImage}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                />
              </View>
            ) : null}
            <AppText variant="caption" color={theme.colors.muted}>
              {channelNote(channel, attachImage)}
            </AppText>
          </Card>
          <TextField label="Davetli ara" value={search} onChangeText={setSearch} />
          <View style={styles.row}>
            <Button
              label="Tümünü seç"
              variant="secondary"
              onPress={() =>
                setSelected(Object.fromEntries(guests.filter((g) => availability(g)).map((guest) => [guest.id, true])))
              }
              style={styles.grow}
            />
            <Button label="Seçimi temizle" variant="ghost" onPress={() => setSelected({})} style={styles.grow} />
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
                  accessibilityLabel={`${guest.name}${usable ? '' : `, ${status?.reason ?? 'uygun değil'}`}`}
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
                          ? 'Henüz gönderilmedi'
                          : `Daha önce: ${guest.lastInviteChannel ? INVITE_CHANNEL_LABELS[guest.lastInviteChannel] : 'işaretlendi'}`
                        : status?.reason}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </Card>
          <Button
            label={chosen.length ? `${chosen.length} kişi için başlat` : 'Davetli seçin'}
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
                {currentGuest.name} ({(summary?.opened ?? 0) + (summary?.skipped ?? 0) + 1}/{queue.entries.length})
              </AppText>
              <AppText color={theme.colors.muted}>
                {INVITE_CHANNEL_LABELS[channel]} ekranı açılacak. Mesajı kontrol edip göndermeyi siz onaylarsınız.
              </AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {channelNote(channel, attachImage)}
              </AppText>
              <Button
                label={`${INVITE_CHANNEL_LABELS[channel]} ekranını aç`}
                onPress={() => void openCurrent()}
                loading={busy}
              />
              {channel === 'share' && attachment ? (
                <Button label="Görseli ayrıca paylaş" variant="secondary" onPress={() => void shareImageForCurrent()} />
              ) : null}
              <Button label="Bu kişiyi atla" variant="secondary" onPress={skipCurrent} disabled={busy} />
              <Button label="Kuyruğu iptal et" variant="ghost" onPress={cancel} disabled={busy} />
            </>
          ) : null}
          {queueFinished(queue) ? (
            <>
              <AppText variant="subtitle">{queue.cancelled ? 'Gönderim iptal edildi' : 'Gönderim tamamlandı'}</AppText>
              <AppText color={theme.colors.muted}>
                {summary?.opened ?? 0} gönderim ekranı açıldı · {summary?.skipped ?? 0} atlandı
                {summary?.cancelled ? ` · ${summary.cancelled} iptal` : ''}
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
                        ? 'Gönderildi olarak işaretlendi'
                        : 'Gönderim ekranı açıldı'
                      : item.state === 'waiting'
                        ? 'Sırada'
                        : item.state === 'cancelled'
                          ? 'İptal edildi'
                          : (item.reason ?? 'Atlandı')}
                  </AppText>
                </View>
                {item.state === 'opened' && guest?.inviteStatus !== 'markedSent' ? (
                  <Button label="Gönderildi işaretle" variant="ghost" onPress={() => void markSent(item.guestId)} />
                ) : null}
              </View>
            );
          })}
          {queueFinished(queue) ? <Button label="Bitti" onPress={() => router.back()} /> : null}
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
