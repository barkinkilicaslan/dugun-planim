import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import { EMPTY_PROFILE, type CurrencyCode, type WeddingProfile } from '@/domain/models';

export default function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const theme = useAppTheme();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<WeddingProfile>({ ...EMPTY_PROFILE, currency: 'TRY' });
  const update = <K extends keyof WeddingProfile>(key: K, value: WeddingProfile[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  function next() {
    if (step === 1 && (!profile.couple1Name.trim() || !profile.couple2Name.trim()))
      return Alert.alert('İsimler gerekli', 'Ana ekranı kişiselleştirmek için iki ismi de yazın.');
    if (step === 2 && !/^\d{4}-\d{2}-\d{2}$/.test(profile.weddingDate))
      return Alert.alert('Tarih gerekli', 'Düğün tarihini YYYY-AA-GG biçiminde yazın.');
    if (step === 2 && (profile.estimatedBudgetCents <= 0 || profile.estimatedGuestCount <= 0))
      return Alert.alert('Tahminleri tamamlayın', 'Bütçe ve davetli tahmini sıfırdan büyük olmalıdır.');
    setStep((current) => Math.min(3, current + 1));
  }

  async function finish(askNotifications: boolean) {
    try {
      setSaving(true);
      await completeOnboarding(profile, askNotifications);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Kurulum tamamlanamadı', error instanceof Error ? error.message : 'Lütfen tekrar deneyin.');
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
          accessibilityLabel="Düğün Planım sembolü"
        />
        <AppText variant="title" color={theme.colors.primary}>
          Düğün Planım
        </AppText>
      </View>
      <ProgressBar value={(step + 1) * 25} label={`Kurulum ${step + 1}/4`} />
      <AppText variant="caption" color={theme.colors.muted}>
        Adım {step + 1} / 4
      </AppText>
      {step === 0 ? (
        <Card>
          <AppText variant="display">Her ayrıntı, tek bir sakin planda.</AppText>
          <AppText color={theme.colors.muted}>
            Görevlerinizi, bütçenizi ve davetlilerinizi internete ihtiyaç duymadan yönetin. Verileriniz bu cihazda
            kalır.
          </AppText>
          <Button label="Başlayalım" onPress={next} />
        </Card>
      ) : null}
      {step === 1 ? (
        <Card>
          <AppText variant="title">Sizi nasıl karşılayalım?</AppText>
          <TextField
            label="Birinci isim"
            value={profile.couple1Name}
            onChangeText={(value) => update('couple1Name', value)}
            autoCapitalize="words"
            autoFocus
          />
          <TextField
            label="İkinci isim"
            value={profile.couple2Name}
            onChangeText={(value) => update('couple2Name', value)}
            autoCapitalize="words"
          />
          <View style={styles.actions}>
            <Button label="Geri" variant="ghost" onPress={() => setStep(0)} />
            <Button label="Devam" onPress={next} />
          </View>
        </Card>
      ) : null}
      {step === 2 ? (
        <Card>
          <AppText variant="title">Temel plan</AppText>
          <TextField
            label="Düğün tarihi (YYYY-AA-GG)"
            placeholder="2027-06-12"
            value={profile.weddingDate}
            onChangeText={(value) => update('weddingDate', value)}
            keyboardType="numbers-and-punctuation"
          />
          <TextField
            label="Tahmini toplam bütçe"
            value={profile.estimatedBudgetCents ? String(profile.estimatedBudgetCents / 100) : ''}
            onChangeText={(value) =>
              update('estimatedBudgetCents', Math.max(0, Math.round(Number(value.replace(',', '.')) * 100)) || 0)
            }
            keyboardType="decimal-pad"
          />
          <TextField
            label="Tahmini davetli sayısı"
            value={profile.estimatedGuestCount ? String(profile.estimatedGuestCount) : ''}
            onChangeText={(value) => update('estimatedGuestCount', Math.max(0, Number.parseInt(value, 10)) || 0)}
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
          <View style={styles.actions}>
            <Button label="Geri" variant="ghost" onPress={() => setStep(1)} />
            <Button label="Devam" onPress={next} />
          </View>
        </Card>
      ) : null}
      {step === 3 ? (
        <Card>
          <AppText variant="title">Hatırlatmalar siz karar verdiğinizde</AppText>
          <AppText color={theme.colors.muted}>
            Görevlerin son tarihinden bir gün önce yerel bildirim gösterebiliriz. İzin yalnızca şimdi “İzin ver”
            seçerseniz istenir; reddetseniz de tüm planlama özellikleri çalışır.
          </AppText>
          <Button label="Bildirim izni ver ve bitir" onPress={() => void finish(true)} loading={saving} />
          <Button label="Şimdilik geç" variant="secondary" onPress={() => void finish(false)} disabled={saving} />
          <Button label="Geri" variant="ghost" onPress={() => setStep(2)} disabled={saving} />
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
