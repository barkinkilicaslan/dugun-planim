import { router } from 'expo-router';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';

export default function MoreScreen() {
  return (
    <Screen title="Diğer" subtitle="Planınızın ayrıntıları">
      <Card>
        <ListRow
          title="Masa planı"
          subtitle="Kapasite ve davetli yerleşimi"
          leading="⌑"
          onPress={() => router.push('/tables')}
        />
        <ListRow
          title="Tedarikçiler"
          subtitle="Teklifler, sözleşmeler ve iletişim"
          leading="◇"
          onPress={() => router.push('/vendors')}
        />
        <ListRow
          title="Takvim"
          subtitle="Görev ve ödeme tarihleri"
          leading="▦"
          onPress={() => router.push('/calendar')}
        />
        <ListRow title="Notlar" subtitle="Serbest planlama notları" leading="≡" onPress={() => router.push('/notes')} />
        <ListRow
          title="Ayarlar ve yardım"
          subtitle="Tema, veri, gizlilik ve destek"
          leading="⚙"
          onPress={() => router.push('/settings')}
        />
      </Card>
    </Screen>
  );
}
