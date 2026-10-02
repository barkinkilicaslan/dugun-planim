import { router } from 'expo-router';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { useI18n } from '@/context/language-context';

export default function MoreScreen() {
  const { t } = useI18n();
  return (
    <Screen title={t('more.title')} subtitle={t('more.subtitle')}>
      <Card>
        <ListRow
          title={t('more.tables')}
          subtitle={t('more.tablesHint')}
          leading="⌑"
          onPress={() => router.push('/tables')}
        />
        <ListRow
          title={t('more.invitations')}
          subtitle={t('more.invitationsHint')}
          leading="✉"
          onPress={() => router.push('/invitations')}
        />
        <ListRow
          title={t('more.vendors')}
          subtitle={t('more.vendorsHint')}
          leading="◇"
          onPress={() => router.push('/vendors')}
        />
        <ListRow
          title={t('more.calendar')}
          subtitle={t('more.calendarHint')}
          leading="▦"
          onPress={() => router.push('/calendar')}
        />
        <ListRow
          title={t('more.notes')}
          subtitle={t('more.notesHint')}
          leading="≡"
          onPress={() => router.push('/notes')}
        />
        <ListRow
          title={t('more.settings')}
          subtitle={t('more.settingsHint')}
          leading="⚙"
          onPress={() => router.push('/settings')}
        />
      </Card>
    </Screen>
  );
}
