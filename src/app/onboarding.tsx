import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { DateField } from '@/components/ui/date-field';
import { MoneyField } from '@/components/ui/money-field';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { useAppTheme } from '@/context/theme-context';
import { EMPTY_PROFILE, type CurrencyCode, type WeddingProfile } from '@/domain/models';
import { todayIso, weddingDateError } from '@/domain/wedding-date';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const theme = useAppTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState<string>();
  const [profile, setProfile] = useState<WeddingProfile>({ ...EMPTY_PROFILE, currency: 'TRY' });
  const update = <K extends keyof WeddingProfile>(key: K, value: WeddingProfile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  function next() {
    if (step === 1 && (!profile.couple1Name.trim() || !profile.couple2Name.trim()))
      return Alert.alert(t('onboarding.namesRequiredTitle'), t('onboarding.namesRequiredBody'));
    const dateProblem = step === 2 ? weddingDateError(profile.weddingDate) : undefined;
    if (dateProblem) {
      setDateError(dateProblem);
      return Alert.alert(t('onboarding.dateRequiredTitle'), dateProblem);
    }
    if (step === 2 && (profile.estimatedBudgetCents <= 0 || profile.estimatedGuestCount <= 0))
      return Alert.alert(t('onboarding.estimatesTitle'), t('onboarding.estimatesBody'));
    setStep((current) => Math.min(3, current + 1));
  }

  async function finish(askNotifications: boolean) {
    try {
      setSaving(true);
      await completeOnboarding(profile, askNotifications);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t('onboarding.finishFailed'), error instanceof Error ? error.message : t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <View style={styles.brand}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
          accessibilityLabel={t('onboarding.logo')}
        />
        <AppText variant="title" color={theme.colors.primary}>
          Düğün Planım
        </AppText>
      </View>
      <ProgressBar value={(step + 1) * 25} label={t('onboarding.progress', { step: step + 1 })} />
      <AppText variant="caption" color={theme.colors.muted}>
        {t('onboarding.step', { step: step + 1 })}
      </AppText>
      {step === 0 ? (
        <Card>
          <AppText variant="display">{t('onboarding.welcomeTitle')}</AppText>
          <AppText color={theme.colors.muted}>{t('onboarding.welcomeBody')}</AppText>
          <Button label={t('onboarding.start')} onPress={next} />
        </Card>
      ) : null}
      {step === 1 ? (
        <Card>
          <AppText variant="title">{t('onboarding.namesTitle')}</AppText>
          <TextField
            label={t('onboarding.name1')}
            value={profile.couple1Name}
            onChangeText={(value) => update('couple1Name', value)}
            autoCapitalize="words"
            autoFocus
          />
          <TextField
            label={t('onboarding.name2')}
            value={profile.couple2Name}
            onChangeText={(value) => update('couple2Name', value)}
            autoCapitalize="words"
          />
          <View style={styles.actions}>
            <Button label={t('common.back')} variant="ghost" onPress={() => setStep(0)} />
            <Button label={t('common.continue')} onPress={next} />
          </View>
        </Card>
      ) : null}
      {step === 2 ? (
        <Card>
          <AppText variant="title">{t('onboarding.basicsTitle')}</AppText>
          <DateField
            label={t('onboarding.weddingDate')}
            value={profile.weddingDate}
            minimumDate={todayIso()}
            error={dateError}
            onChange={(value) => {
              setDateError(undefined);
              update('weddingDate', value);
            }}
          />
          <MoneyField
            label={t('onboarding.budgetEstimate')}
            cents={profile.estimatedBudgetCents}
            onChangeCents={(value) => update('estimatedBudgetCents', value)}
          />
          <TextField
            label={t('onboarding.guestEstimate')}
            value={profile.estimatedGuestCount ? String(profile.estimatedGuestCount) : ''}
            onChangeText={(value) => update('estimatedGuestCount', Math.max(0, Number.parseInt(value, 10)) || 0)}
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
          <View style={styles.actions}>
            <Button label={t('common.back')} variant="ghost" onPress={() => setStep(1)} />
            <Button label={t('common.continue')} onPress={next} />
          </View>
        </Card>
      ) : null}
      {step === 3 ? (
        <Card>
          <AppText variant="title">{t('onboarding.remindersTitle')}</AppText>
          <AppText color={theme.colors.muted}>{t('onboarding.remindersBody')}</AppText>
          <Button label={t('onboarding.allowAndFinish')} onPress={() => void finish(true)} loading={saving} />
          <Button
            label={t('onboarding.skipAndFinish')}
            variant="secondary"
            onPress={() => void finish(false)}
            disabled={saving}
          />
          <Button label={t('common.back')} variant="ghost" onPress={() => setStep(2)} disabled={saving} />
        </Card>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 84, height: 84, borderRadius: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
