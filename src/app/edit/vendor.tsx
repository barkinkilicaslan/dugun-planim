import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { MoneyField } from '@/components/ui/money-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import type { ContractStatus, Vendor } from '@/domain/models';

export default function VendorEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveVendor, deleteVendor } = useApp();
  const { t } = useI18n();
  const existing = data.vendors.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<Vendor>(
    existing ?? {
      id: createId(),
      category: t('starter.vendorDefaultCategory'),
      name: '',
      phone: '',
      email: '',
      quoteCents: 0,
      contractStatus: 'researching',
      paymentPlan: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  );
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof Vendor>(key: K, value: Vendor[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    try {
      setSaving(true);
      await saveVendor({ ...form, updatedAt: new Date().toISOString() });
      router.back();
    } catch (error) {
      Alert.alert(t('vendorEditor.saveFailed'), (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert(t('vendorEditor.deleteTitle'), t('vendorEditor.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteVendor(form.id)
            .then(() => router.back())
            .catch((error) =>
              Alert.alert(t('common.deleteFailed'), error instanceof Error ? error.message : t('common.unknownError')),
            ),
      },
    ]);
  }
  return (
    <Screen title={existing ? t('vendorEditor.edit') : t('vendorEditor.new')}>
      <Card>
        <TextField
          label={t('vendorEditor.name')}
          value={form.name}
          onChangeText={(value) => update('name', value)}
          autoFocus
        />
        <TextField
          label={t('vendorEditor.category')}
          value={form.category}
          onChangeText={(value) => update('category', value)}
          placeholder={t('vendorEditor.categoryPlaceholder')}
        />
        <TextField
          label={t('vendorEditor.phone')}
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          keyboardType="phone-pad"
        />
        <TextField
          label={t('vendorEditor.email')}
          value={form.email}
          onChangeText={(value) => update('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.actions}>
          {form.phone ? (
            <Button
              label={t('vendorEditor.call')}
              variant="secondary"
              onPress={() => void Linking.openURL(`tel:${form.phone}`)}
            />
          ) : null}
          {form.email ? (
            <Button
              label={t('vendorEditor.sendEmail')}
              variant="secondary"
              onPress={() => void Linking.openURL(`mailto:${form.email}`)}
            />
          ) : null}
        </View>
        <MoneyField
          label={t('vendorEditor.quote', { currency: data.profile.currency })}
          cents={form.quoteCents}
          onChangeCents={(value) => update('quoteCents', value)}
        />
        <Chips<ContractStatus>
          label={t('vendorEditor.contractStatus')}
          value={form.contractStatus}
          onChange={(value) => update('contractStatus', value)}
          options={[
            { value: 'researching', label: t('vendor.status.researching') },
            { value: 'quoted', label: t('vendor.status.quoted') },
            { value: 'signed', label: t('vendor.status.signed') },
            { value: 'completed', label: t('vendor.status.completed') },
          ]}
        />
        <TextField
          label={t('vendorEditor.paymentPlan')}
          value={form.paymentPlan}
          onChangeText={(value) => update('paymentPlan', value)}
          multiline
        />
        <TextField
          label={t('vendorEditor.notes')}
          value={form.notes}
          onChangeText={(value) => update('notes', value)}
          multiline
        />
        <View style={styles.actions}>
          <Button label={t('common.save')} onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} /> : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flex: 1 },
});
