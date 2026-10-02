import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useApp } from '@/context/app-context';
import { useI18n } from '@/context/language-context';
import { formatMoney } from '@/domain/calculations';
export default function VendorsScreen() {
  const { data } = useApp();
  const { t, locale, intl } = useI18n();
  const [search, setSearch] = useState('');
  const vendors = data.vendors.filter((vendor) =>
    `${vendor.name} ${vendor.category}`.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)),
  );
  return (
    <Screen
      title={t('nav.vendors')}
      subtitle={t('vendors.subtitle', { count: data.vendors.length })}
      action={<Button label={t('common.add')} onPress={() => router.push('/edit/vendor')} />}
    >
      <TextField
        label={t('vendors.search')}
        value={search}
        onChangeText={setSearch}
        placeholder={t('vendors.searchPlaceholder')}
      />
      {vendors.length ? (
        <Card>
          {vendors.map((vendor) => (
            <ListRow
              key={vendor.id}
              title={vendor.name}
              subtitle={`${vendor.category} · ${t(`vendor.status.${vendor.contractStatus}`)}`}
              meta={formatMoney(vendor.quoteCents, data.profile.currency, intl)}
              onPress={() => router.push(`/edit/vendor?id=${vendor.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title={t('vendors.notFound')}
          description={search ? t('common.searchTextHint') : t('vendors.emptyHint')}
          actionLabel={t('vendors.add')}
          onAction={() => router.push('/edit/vendor')}
        />
      )}
    </Screen>
  );
}
