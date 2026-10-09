import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import type { BudgetItem } from '@/domain/models';

export default function BudgetEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveBudgetItem, deleteBudgetItem } = useApp();
  const { t } = useI18n();
  const existing = data.budgetItems.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<BudgetItem>(
    existing ?? {
      id: createId(),
      category: '',
      title: '',
      plannedCents: 0,
      actualCents: 0,
      paidCents: 0,
      dueDate: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
  );
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof BudgetItem>(key: K, value: BudgetItem[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit() {
    try {
      setSaving(true);
      await saveBudgetItem({ ...form, updatedAt: new Date().toISOString() });
      router.back();
    } catch (error) {
      Alert.alert(t('budgetEditor.saveFailed'), (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert(t('budgetEditor.deleteTitle'), t('common.irreversible'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void deleteBudgetItem(form.id)
            .then(() => router.back())
            .catch((error) =>
              Alert.alert(t('common.deleteFailed'), error instanceof Error ? error.message : t('common.unknownError')),
            ),
      },
    ]);
  }
  return (
    <Screen title={existing ? t('budgetEditor.edit') : t('budgetEditor.new')}>
      <Card>
        <TextField
          label={t('budgetEditor.name')}
          value={form.title}
          onChangeText={(value) => update('title', value)}
          autoFocus
        />
        <TextField
          label={t('budgetEditor.category')}
          value={form.category}
          onChangeText={(value) => update('category', value)}
          placeholder={t('budgetEditor.categoryPlaceholder')}
        />
        <MoneyField
          label={t('budgetEditor.planned', { currency: data.profile.currency })}
          cents={form.plannedCents}
          onChangeCents={(value) => update('plannedCents', value)}
        />
        <MoneyField
          label={t('budgetEditor.actual', { currency: data.profile.currency })}
          cents={form.actualCents}
          onChangeCents={(value) => update('actualCents', value)}
        />
        <MoneyField
          label={t('budgetEditor.paid', { currency: data.profile.currency })}
          cents={form.paidCents}
          onChangeCents={(value) => update('paidCents', value)}
        />
        <TextField
          label={t('budgetEditor.due')}
          value={form.dueDate}
          onChangeText={(value) => update('dueDate', value)}
          keyboardType="numbers-and-punctuation"
        />
        <Chips<string>
          label={t('budgetEditor.vendor')}
          value={form.vendorId ?? ''}
          onChange={(value) => update('vendorId', value || undefined)}
          options={[
            { value: '', label: t('budgetEditor.noVendor') },
            ...data.vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
          ]}
        />
        <TextField
          label={t('budgetEditor.notes')}
          value={form.notes}
          onChangeText={(value) => update('notes', value)}
          multiline
        />
        <View style={styles.actions}>
          <Button label={t('common.save')} onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? (
            <Button label={t('common.delete')} variant="danger" onPress={confirmDelete} disabled={saving} />
          ) : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: spacing.sm }, grow: { flex: 1 } });
