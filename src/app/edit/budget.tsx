import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { BudgetItem } from '@/domain/models';

const cents = (value: string) => Math.max(0, Math.round(Number(value.replace(',', '.')) * 100)) || 0;
export default function BudgetEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveBudgetItem, deleteBudgetItem } = useApp();
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
      Alert.alert('Bütçe kalemi kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert('Bütçe kalemi silinsin mi?', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteBudgetItem(form.id).then(() => router.back()) },
    ]);
  }
  return (
    <Screen title={existing ? 'Kalemi düzenle' : 'Yeni bütçe kalemi'}>
      <Card>
        <TextField label="Kalem adı" value={form.title} onChangeText={(value) => update('title', value)} autoFocus />
        <TextField
          label="Kategori"
          value={form.category}
          onChangeText={(value) => update('category', value)}
          placeholder="Örn. Mekân"
        />
        <TextField
          label={`Planlanan (${data.profile.currency})`}
          value={form.plannedCents ? String(form.plannedCents / 100) : ''}
          onChangeText={(value) => update('plannedCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <TextField
          label={`Gerçekleşen (${data.profile.currency})`}
          value={form.actualCents ? String(form.actualCents / 100) : ''}
          onChangeText={(value) => update('actualCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <TextField
          label={`Ödenen (${data.profile.currency})`}
          value={form.paidCents ? String(form.paidCents / 100) : ''}
          onChangeText={(value) => update('paidCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <TextField
          label="Ödeme vadesi (YYYY-AA-GG)"
          value={form.dueDate}
          onChangeText={(value) => update('dueDate', value)}
          keyboardType="numbers-and-punctuation"
        />
        <Chips<string>
          label="Tedarikçi"
          value={form.vendorId ?? ''}
          onChange={(value) => update('vendorId', value || undefined)}
          options={[
            { value: '', label: 'Bağlantı yok' },
            ...data.vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
          ]}
        />
        <TextField label="Notlar" value={form.notes} onChangeText={(value) => update('notes', value)} multiline />
        <View style={styles.actions}>
          <Button label="Kaydet" onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} disabled={saving} /> : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: spacing.sm }, grow: { flex: 1 } });
