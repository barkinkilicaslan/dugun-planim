import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chips } from '@/components/ui/chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import type { ContractStatus, Vendor } from '@/domain/models';

const cents = (value: string) => Math.max(0, Math.round(Number(value.replace(',', '.')) * 100)) || 0;
export default function VendorEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, createId, saveVendor, deleteVendor } = useApp();
  const existing = data.vendors.find((item) => item.id === id);
  const now = new Date().toISOString();
  const [form, setForm] = useState<Vendor>(
    existing ?? {
      id: createId(),
      category: 'Mekân',
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
      Alert.alert('Tedarikçi kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  function confirmDelete() {
    Alert.alert('Tedarikçi silinsin mi?', 'İlişkili bütçe kalemlerinde bağlantı kaldırılır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void deleteVendor(form.id).then(() => router.back()) },
    ]);
  }
  return (
    <Screen title={existing ? 'Tedarikçiyi düzenle' : 'Yeni tedarikçi'}>
      <Card>
        <TextField label="İsim" value={form.name} onChangeText={(value) => update('name', value)} autoFocus />
        <TextField
          label="Kategori"
          value={form.category}
          onChangeText={(value) => update('category', value)}
          placeholder="Mekân, fotoğrafçı…"
        />
        <TextField
          label="Telefon"
          value={form.phone}
          onChangeText={(value) => update('phone', value)}
          keyboardType="phone-pad"
        />
        <TextField
          label="E-posta"
          value={form.email}
          onChangeText={(value) => update('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.actions}>
          {form.phone ? (
            <Button label="Ara" variant="secondary" onPress={() => void Linking.openURL(`tel:${form.phone}`)} />
          ) : null}
          {form.email ? (
            <Button label="E-posta" variant="secondary" onPress={() => void Linking.openURL(`mailto:${form.email}`)} />
          ) : null}
        </View>
        <TextField
          label={`Teklif (${data.profile.currency})`}
          value={form.quoteCents ? String(form.quoteCents / 100) : ''}
          onChangeText={(value) => update('quoteCents', cents(value))}
          keyboardType="decimal-pad"
        />
        <Chips<ContractStatus>
          label="Sözleşme durumu"
          value={form.contractStatus}
          onChange={(value) => update('contractStatus', value)}
          options={[
            { value: 'researching', label: 'Araştırılıyor' },
            { value: 'quoted', label: 'Teklif alındı' },
            { value: 'signed', label: 'İmzalandı' },
            { value: 'completed', label: 'Tamamlandı' },
          ]}
        />
        <TextField
          label="Ödeme planı"
          value={form.paymentPlan}
          onChangeText={(value) => update('paymentPlan', value)}
          multiline
        />
        <TextField label="Notlar" value={form.notes} onChangeText={(value) => update('notes', value)} multiline />
        <View style={styles.actions}>
          <Button label="Kaydet" onPress={() => void submit()} loading={saving} style={styles.grow} />
          {existing ? <Button label="Sil" variant="danger" onPress={confirmDelete} /> : null}
        </View>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flex: 1 },
});
