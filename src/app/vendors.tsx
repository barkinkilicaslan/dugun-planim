import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useApp } from '@/context/app-context';
import { formatMoney } from '@/domain/calculations';
const status = {
  researching: 'Araştırılıyor',
  quoted: 'Teklif alındı',
  signed: 'İmzalandı',
  completed: 'Tamamlandı',
} as const;
export default function VendorsScreen() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const vendors = data.vendors.filter((vendor) =>
    `${vendor.name} ${vendor.category}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')),
  );
  return (
    <Screen
      title="Tedarikçiler"
      subtitle={`${data.vendors.length} kayıt`}
      action={<Button label="+ Ekle" onPress={() => router.push('/edit/vendor')} />}
    >
      <TextField label="Tedarikçi ara" value={search} onChangeText={setSearch} placeholder="İsim veya kategori" />
      {vendors.length ? (
        <Card>
          {vendors.map((vendor) => (
            <ListRow
              key={vendor.id}
              title={vendor.name}
              subtitle={`${vendor.category} · ${status[vendor.contractStatus]}`}
              meta={formatMoney(vendor.quoteCents, data.profile.currency)}
              onPress={() => router.push(`/edit/vendor?id=${vendor.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Tedarikçi bulunamadı"
          description={
            search
              ? 'Arama metnini değiştirin.'
              : 'Teklifleri ve sözleşme durumunu izlemek için ilk tedarikçiyi ekleyin.'
          }
          actionLabel="Tedarikçi ekle"
          onAction={() => router.push('/edit/vendor')}
        />
      )}
    </Screen>
  );
}
