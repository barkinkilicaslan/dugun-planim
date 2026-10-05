import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StyleOptionRow } from '@/components/theme/style-option-row';
import { THEME_COPY } from '@/components/theme/theme-copy';
import { Chips } from '@/components/ui/chips';
import { DateField } from '@/components/ui/date-field';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme, useThemeControls } from '@/context/theme-context';
import { createBackup, parseBackup } from '@/domain/backup';
import { backupPhotoNoticeBody, backupPhotoNoticeTitle, restoreCompleteMessage } from '@/domain/backup-notices';
import { THEME_IDS } from '@/constants/themes';
import { APP_VERSION, type CurrencyCode, type DateFormatPreference, type WeddingProfile } from '@/domain/models';
import {
  ADULTS_ONLY_PRESET_COUNT,
  adultsOnlyPreset,
  adultsOnlyPresetIndex,
  adultsOnlyPresetMarker,
  resolveAdultsOnlyText,
} from '@/domain/invitation-templates';
import { type LanguagePreference } from '@/i18n';
import { requestNotificationConsent } from '@/services/notifications';
import { pickTextFile, shareTextFile } from '@/services/export';
const cents = (value: string) => Math.max(0, Math.round(Number(value.replace(',', '.')) * 100)) || 0;
export default function SettingsScreen() {
  const { data, saveProfile, replaceAll, clearAll } = useApp();
  const theme = useAppTheme();
  const { themeId, setThemeId, resetTheme } = useThemeControls();
  const { t, locale, preference, setPreference } = useI18n();
  const [profile, setProfile] = useState<WeddingProfile>({ ...data.profile });
  const [saving, setSaving] = useState(false);
  const supportEmail = String(Constants.expoConfig?.extra?.supportEmail ?? 'appsupportline@gmail.com');
  const update = <K extends keyof WeddingProfile>(key: K, value: WeddingProfile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));
  async function save() {
    try {
      setSaving(true);
      await saveProfile(profile);
      Alert.alert(t('settings.saved'), t('settings.savedBody'));
    } catch (error) {
      Alert.alert(t('settings.saveFailed'), (error as Error).message);
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
        granted ? t('settings.notificationsGranted') : t('settings.notificationsDenied'),
        granted ? t('settings.notificationsGrantedBody') : t('settings.notificationsDeniedBody'),
      );
    } catch (error) {
      Alert.alert(t('settings.permissionCheckFailed'), (error as Error).message);
    }
  }
  async function shareBackup() {
    try {
      await shareTextFile(
        t('settings.backupFile', { date: new Date().toISOString().slice(0, 10) }),
        createBackup(data),
        'application/json',
      );
    } catch (error) {
      Alert.alert(t('settings.backupFailed'), (error as Error).message);
    }
  }
  /** Yedek alınmadan önce fotoğrafların dosyaya girmediği açıkça söylenir. */
  function backup() {
    Alert.alert(backupPhotoNoticeTitle(t), backupPhotoNoticeBody(t), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.backupConfirm'), onPress: () => void shareBackup() },
    ]);
  }
  async function restore() {
    try {
      const raw = await pickTextFile(['application/json', 'text/json']);
      if (!raw) return;
      const restored = parseBackup(raw);
      Alert.alert(t('settings.restoreTitle'), t('settings.restoreBody', { note: backupPhotoNoticeBody(t) }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.restoreConfirm'),
          onPress: () =>
            void replaceAll(restored)
              .then(() =>
                Alert.alert(t('settings.restoreDone'), restoreCompleteMessage(t, restored.invitationDesigns.length)),
              )
              .catch((error) => Alert.alert(t('settings.restoreFailed'), error.message)),
        },
      ]);
    } catch (error) {
      Alert.alert(t('settings.backupInvalid'), (error as Error).message);
    }
  }
  function deleteEverything() {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteContinue'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.deleteFinalTitle'), t('settings.deleteFinalBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('settings.deleteEverything'),
              style: 'destructive',
              onPress: () =>
                void clearAll()
                  .then(() => {
                    // Önce yığın başa alınıp "Tarzını seç" açılır, sonra tarz sıfırlanır; böylece alttaki sekme
                    // düzeninin koruma yönlendirmesi ikinci bir yönlendirme üretmez.
                    if (router.canDismiss()) router.dismissAll();
                    router.replace('/style-select');
                    resetTheme();
                  })
                  .catch((error) => Alert.alert(t('settings.deleteFailed'), (error as Error).message)),
            },
          ]),
      },
    ]);
  }
  const storedPresetIndex = adultsOnlyPresetIndex(profile.adultsOnlyMessage);
  const selectedPreset = profile.adultsOnlyMessage.trim() === '' ? 0 : storedPresetIndex;
  const languageNames: Record<LanguagePreference, string> = {
    auto: t('language.auto'),
    tr: t('language.tr'),
    en: t('language.en'),
  };
  return (
    <Screen title={t('nav.settings')} subtitle={t('settings.subtitle')}>
      <SectionHeader title={t('language.sectionTitle')} />
      <Card>
        <Chips<LanguagePreference>
          label={t('language.label')}
          value={preference}
          onChange={setPreference}
          options={[
            { value: 'auto', label: languageNames.auto },
            { value: 'tr', label: languageNames.tr },
            { value: 'en', label: languageNames.en },
          ]}
        />
        <AppText variant="caption" color={theme.colors.muted}>
          {t('language.current', { language: languageNames[locale] })}
        </AppText>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('language.hint')}
        </AppText>
      </Card>
      <SectionHeader title={t('settings.sectionWedding')} />
      <Card>
        <TextField
          label={t('onboarding.name1')}
          value={profile.couple1Name}
          onChangeText={(value) => update('couple1Name', value)}
        />
        <TextField
          label={t('onboarding.name2')}
          value={profile.couple2Name}
          onChangeText={(value) => update('couple2Name', value)}
        />
        <DateField
          label={t('onboarding.weddingDate')}
          value={profile.weddingDate}
          onChange={(value) => update('weddingDate', value)}
        />
        <TextField
          label={t('settings.estimatedBudget')}
          value={profile.estimatedBudgetCents ? String(profile.estimatedBudgetCents / 100) : ''}
          onChangeText={(value) => update('estimatedBudgetCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <TextField
          label={t('settings.estimatedGuests')}
          value={String(profile.estimatedGuestCount)}
          onChangeText={(value) => update('estimatedGuestCount', Number.parseInt(value, 10) || 0)}
          keyboardType="number-pad"
        />
        <Chips<CurrencyCode>
          label={t('onboarding.currency')}
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
          label={t('settings.dateFormat')}
          value={profile.dateFormat}
          onChange={(value) => update('dateFormat', value)}
          options={[
            { value: 'DD.MM.YYYY', label: t('settings.dateFormatDmy') },
            { value: 'YYYY-MM-DD', label: t('settings.dateFormatIso') },
          ]}
        />
        <Button label={t('settings.saveDetails')} onPress={() => void save()} loading={saving} />
      </Card>
      <SectionHeader title={t('settings.sectionChildren')} />
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <AppText variant="label">{t('settings.adultsOnly')}</AppText>
            <AppText variant="caption" color={theme.colors.muted}>
              {t('settings.adultsOnlyHint')}
            </AppText>
          </View>
          <Switch
            accessibilityLabel={t('settings.adultsOnly')}
            value={profile.adultsOnly}
            onValueChange={(value) => update('adultsOnly', value)}
            trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
          />
        </View>
        {profile.adultsOnly ? (
          <>
            <View style={styles.presets}>
              {Array.from({ length: ADULTS_ONLY_PRESET_COUNT }, (_, index) => (
                <Button
                  key={index}
                  label={t('settings.presetMessage', { n: index + 1 })}
                  variant={selectedPreset === index ? 'primary' : 'secondary'}
                  onPress={() => update('adultsOnlyMessage', adultsOnlyPresetMarker(index))}
                />
              ))}
            </View>
            <TextField
              label={t('settings.adultsMessage')}
              value={resolveAdultsOnlyText(t, profile.adultsOnlyMessage) || adultsOnlyPreset(t, 0)}
              onChangeText={(value) => update('adultsOnlyMessage', value)}
              multiline
              maxLength={400}
            />
          </>
        ) : null}
        <Button
          label={t('settings.saveChildPolicy')}
          variant="secondary"
          onPress={() => void save()}
          loading={saving}
        />
      </Card>
      <SectionHeader title={t('settings.sectionStyle')} />
      <Card>
        <View accessibilityRole="radiogroup" style={styles.styles}>
          {THEME_IDS.map((id) => (
            <StyleOptionRow key={id} id={id} selected={themeId === id} onPress={setThemeId} />
          ))}
        </View>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('settings.styleCurrent', { name: t(THEME_COPY[themeId].name) })}
        </AppText>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('settings.styleHint')}
        </AppText>
      </Card>
      <SectionHeader title={t('settings.sectionNotifications')} />
      <Card>
        <ListRow
          title={t('settings.notifications')}
          subtitle={data.profile.notificationsEnabled ? t('settings.notificationsOn') : t('settings.notificationsOff')}
          meta={data.profile.notificationsEnabled ? t('common.on') : t('common.off')}
          onPress={() => void enableNotifications()}
        />
      </Card>
      <SectionHeader title={t('settings.sectionData')} />
      <Card>
        <ListRow title={t('settings.createBackup')} subtitle={t('settings.createBackupHint')} onPress={backup} />
        <ListRow
          title={t('settings.restoreBackup')}
          subtitle={t('settings.restoreBackupHint')}
          onPress={() => void restore()}
        />
        <ListRow
          title={t('settings.deleteAll')}
          subtitle={t('settings.deleteAllHint')}
          meta={t('settings.permanent')}
          onPress={deleteEverything}
        />
      </Card>
      <SectionHeader title={t('settings.sectionHelp')} />
      <Card>
        <ListRow title={t('legal.privacy.title')} onPress={() => router.push('/legal/privacy')} />
        <ListRow title={t('legal.terms.title')} onPress={() => router.push('/legal/terms')} />
        <ListRow title={t('legal.data.title')} onPress={() => router.push('/legal/data')} />
        <ListRow title={t('legal.licenses.title')} onPress={() => router.push('/legal/licenses')} />
        <ListRow title={t('legal.support.title')} onPress={() => router.push('/legal/support')} />
        <ListRow
          title={t('settings.feedback')}
          subtitle={supportEmail}
          onPress={() =>
            void Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent(t('settings.feedbackSubject'))}`)
          }
        />
      </Card>
      <Card>
        <AppText variant="label">
          {t('settings.version', { version: Application.nativeApplicationVersion ?? APP_VERSION })}
        </AppText>
        <AppText variant="caption" color={theme.colors.muted}>
          {t('settings.disclaimer')}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchCopy: { flex: 1, gap: 4 },
  presets: { gap: 8 },
  styles: { gap: 8 },
});
