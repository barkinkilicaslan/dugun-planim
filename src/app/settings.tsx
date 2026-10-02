import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { DateField } from '@/components/ui/date-field';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import { createBackup, parseBackup } from '@/domain/backup';
import { BACKUP_PHOTO_NOTICE_BODY, BACKUP_PHOTO_NOTICE_TITLE, restoreCompleteMessage } from '@/domain/backup-notices';
import {
  APP_VERSION,
  type CurrencyCode,
  type DateFormatPreference,
  type ThemePreference,
  type WeddingProfile,
} from '@/domain/models';
import { ADULTS_ONLY_PRESETS } from '@/domain/invitation-templates';
import { requestNotificationConsent } from '@/services/notifications';
import { pickTextFile, shareTextFile } from '@/services/export';
const cents = (value: string) => Math.max(0, Math.round(Number(value.replace(',', '.')) * 100)) || 0;
export default function SettingsScreen() {
  const { data, saveProfile, replaceAll, clearAll } = useApp();
  const theme = useAppTheme();
  const [profile, setProfile] = useState<WeddingProfile>({ ...data.profile });
  const [saving, setSaving] = useState(false);
  const supportEmail = String(Constants.expoConfig?.extra?.supportEmail ?? 'destek@example.com');
  const update = <K extends keyof WeddingProfile>(key: K, value: WeddingProfile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));
  async function save() {
    try {
      setSaving(true);
      await saveProfile(profile);
      Alert.alert('Kaydedildi', 'Ayarlarınız güncellendi.');
    } catch (error) {
      Alert.alert('Ayarlar kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function enableNotifications() {
    try {
      const granted = await requestNotificationConsent();
      update('notificationsEnabled', granted);
      await saveProfile({ ...profile, notificationsEnabled: granted });
      Alert.alert(
        granted ? 'Bildirimler açık' : 'İzin verilmedi',
        granted
          ? 'Yeni görevlerde yerel hatırlatma seçebilirsiniz.'
          : 'Uygulama bildirim olmadan çalışmaya devam eder.',
      );
    } catch (error) {
      Alert.alert('İzin kontrol edilemedi', (error as Error).message);
    }
  }
  async function shareBackup() {
    try {
      await shareTextFile(
        `dugun-planim-yedek-${new Date().toISOString().slice(0, 10)}.json`,
        createBackup(data),
        'application/json',
      );
    } catch (error) {
      Alert.alert('Yedek oluşturulamadı', (error as Error).message);
    }
  }
  /** Yedek alınmadan önce fotoğrafların dosyaya girmediği açıkça söylenir. */
  function backup() {
    Alert.alert(BACKUP_PHOTO_NOTICE_TITLE, BACKUP_PHOTO_NOTICE_BODY, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Yedeği oluştur', onPress: () => void shareBackup() },
    ]);
  }
  async function restore() {
    try {
      const raw = await pickTextFile(['application/json', 'text/json']);
      if (!raw) return;
      const restored = parseBackup(raw);
      Alert.alert(
        'Yedek geri yüklensin mi?',
        `Mevcut cihaz verileri doğrulanmış yedekteki verilerle değiştirilecek. ${BACKUP_PHOTO_NOTICE_BODY}`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Geri yükle',
            onPress: () =>
              void replaceAll(restored)
                .then(() => Alert.alert('Tamamlandı', restoreCompleteMessage(restored.invitationDesigns.length)))
                .catch((error) => Alert.alert('Geri yüklenemedi', error.message)),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Yedek geçersiz', (error as Error).message);
    }
  }
  function deleteEverything() {
    Alert.alert(
      'Tüm yerel veriler silinsin mi?',
      'Görevler, davetliler, bütçe, masalar, tedarikçiler ve notlar kalıcı olarak silinir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam et',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Son onay', 'Bu işlem geri alınamaz. Gerçekten tüm verileri silmek istiyor musunuz?', [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Tümünü sil',
                style: 'destructive',
                onPress: () => void clearAll().then(() => router.replace('/onboarding')),
              },
            ]),
        },
      ],
    );
  }
  return (
    <Screen title="Ayarlar" subtitle="Plan, görünüm, veri ve yardım">
      <SectionHeader title="Düğün bilgileri" />
      <Card>
        <TextField
          label="Birinci isim"
          value={profile.couple1Name}
          onChangeText={(value) => update('couple1Name', value)}
        />
        <TextField
          label="İkinci isim"
          value={profile.couple2Name}
          onChangeText={(value) => update('couple2Name', value)}
        />
        <DateField
          label="Düğün tarihi"
          value={profile.weddingDate}
          onChange={(value) => update('weddingDate', value)}
        />
        <TextField
          label="Tahmini bütçe"
          value={profile.estimatedBudgetCents ? String(profile.estimatedBudgetCents / 100) : ''}
          onChangeText={(value) => update('estimatedBudgetCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Tahmini davetli"
          value={String(profile.estimatedGuestCount)}
          onChangeText={(value) => update('estimatedGuestCount', Number.parseInt(value, 10) || 0)}
          keyboardType="number-pad"
        />
        <Chips<CurrencyCode>
          label="Para birimi"
          value={profile.currency}
          onChange={(value) => update('currency', value)}
          options={[
            { value: 'TRY', label: '₺ TRY' },
            { value: 'EUR', label: '€ EUR' },
            { value: 'USD', label: '$ USD' },
            { value: 'GBP', label: '£ GBP' },
          ]}
        />
        <Chips<DateFormatPreference>
          label="Tarih biçimi"
          value={profile.dateFormat}
          onChange={(value) => update('dateFormat', value)}
          options={[
            { value: 'DD.MM.YYYY', label: 'GG.AA.YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-AA-GG' },
          ]}
        />
        <Button label="Bilgileri kaydet" onPress={() => void save()} loading={saving} />
      </Card>
      <SectionHeader title="Çocuk politikası" />
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <AppText variant="label">Düğünümüz yetişkinlere özeldir</AppText>
            <AppText variant="caption" color={theme.colors.muted}>
              Açıkken davetiye önizlemesinde, PNG/PDF çıktısında ve paylaşım mesajlarında nazik bir not görünür.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Düğünümüz yetişkinlere özeldir"
            value={profile.adultsOnly}
            onValueChange={(value) =>
              setProfile((current) => ({
                ...current,
                adultsOnly: value,
                adultsOnlyMessage:
                  value && !current.adultsOnlyMessage ? ADULTS_ONLY_PRESETS[0] : current.adultsOnlyMessage,
              }))
            }
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
        {profile.adultsOnly ? (
          <>
            <View style={styles.presets}>
              {ADULTS_ONLY_PRESETS.map((preset, index) => (
                <Button
                  key={preset}
                  label={`Hazır mesaj ${index + 1}`}
                  variant={profile.adultsOnlyMessage === preset ? 'primary' : 'secondary'}
                  onPress={() => update('adultsOnlyMessage', preset)}
                />
              ))}
            </View>
            <TextField
              label="Çocuksuz düğün mesajı"
              value={profile.adultsOnlyMessage}
              onChangeText={(value) => update('adultsOnlyMessage', value)}
              multiline
              maxLength={400}
            />
          </>
        ) : null}
        <Button label="Çocuk politikasını kaydet" variant="secondary" onPress={() => void save()} loading={saving} />
      </Card>
      <SectionHeader title="Görünüm ve bildirim" />
      <Card>
        <Chips<ThemePreference>
          label="Tema"
          value={profile.theme}
          onChange={(value) => update('theme', value)}
          options={[
            { value: 'light', label: 'Açık' },
            { value: 'dark', label: 'Koyu' },
            { value: 'system', label: 'Sistem' },
          ]}
        />
        <Button label="Tema tercihini kaydet" variant="secondary" onPress={() => void save()} />
        <ListRow
          title="Yerel bildirimler"
          subtitle={data.profile.notificationsEnabled ? 'İzin verildi' : 'İzin yok; uygulama etkilenmez'}
          meta={data.profile.notificationsEnabled ? 'Açık' : 'Kapalı'}
          onPress={() => void enableNotifications()}
        />
      </Card>
      <SectionHeader title="Veriler" />
      <Card>
        <ListRow
          title="Yedek dosyası oluştur"
          subtitle="Sürümlü JSON; davetiye fotoğrafları dahil edilmez"
          onPress={backup}
        />
        <ListRow
          title="Yedekten geri yükle"
          subtitle="Dosya önce doğrulanır, sonra onay istenir"
          onPress={() => void restore()}
        />
        <ListRow
          title="Tüm verilerimi sil"
          subtitle="İki onaydan sonra cihaz verileri silinir"
          meta="Kalıcı"
          onPress={deleteEverything}
        />
      </Card>
      <SectionHeader title="Yardım ve hukuki" />
      <Card>
        <ListRow title="Gizlilik Politikası" onPress={() => router.push('/legal/privacy')} />
        <ListRow title="Kullanım Koşulları" onPress={() => router.push('/legal/terms')} />
        <ListRow title="Veri saklama ve silme" onPress={() => router.push('/legal/data')} />
        <ListRow title="Açık kaynak lisansları" onPress={() => router.push('/legal/licenses')} />
        <ListRow title="Destek ve SSS" onPress={() => router.push('/legal/support')} />
        <ListRow
          title="Geri bildirim gönder"
          subtitle={supportEmail}
          onPress={() =>
            void Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent('Düğün Planım Geri Bildirim')}`)
          }
        />
      </Card>
      <Card>
        <AppText variant="label">Düğün Planım {Application.nativeApplicationVersion ?? APP_VERSION}</AppText>
        <AppText variant="caption" color={theme.colors.muted}>
          Bu uygulama profesyonel düğün, hukuk veya finans danışmanlığı sağlamaz.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchCopy: { flex: 1, gap: 4 },
  presets: { gap: 8 },
});
