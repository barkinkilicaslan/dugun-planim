import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ScaledInvitation } from '@/components/invitation/scaled-invitation';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { spacing } from '@/constants/theme';
import { useApp } from '@/context/app-context';
import { useAppTheme } from '@/context/theme-context';
import { createInvitationDesign, resolveInvitationContent } from '@/domain/invitation-content';
import { INVITATION_TEMPLATES, paletteById, templateById } from '@/domain/invitation-templates';

const THUMB_WIDTH = 150;

export default function InvitationsScreen() {
  const { data } = useApp();
  const theme = useAppTheme();
  const sampleDesigns = INVITATION_TEMPLATES.map((template) =>
    createInvitationDesign(template.id, template.id, '', false),
  );

  return (
    <Screen title="Davetiyeler" subtitle="10 şablon · PNG ve PDF olarak cihazınızda hazırlanır">
      <SectionHeader title="Tasarımlarım" />
      {data.invitationDesigns.length ? (
        <Card>
          {data.invitationDesigns.map((design) => {
            const template = templateById(design.templateId);
            return (
              <Pressable
                key={design.id}
                accessibilityRole="button"
                accessibilityLabel={`${design.name}${design.isDefault ? ', varsayılan' : ''} düzenle`}
                onPress={() => router.push(`/invitation-editor?id=${design.id}`)}
                style={[styles.designRow, { borderBottomColor: theme.colors.border }]}
              >
                <ScaledInvitation
                  width={72}
                  content={resolveInvitationContent(design, data.profile)}
                  template={template}
                  palette={paletteById(design.paletteId)}
                />
                <View style={styles.designCopy}>
                  <AppText variant="label">{design.name}</AppText>
                  <AppText variant="caption" color={theme.colors.muted}>
                    {template.name}
                    {design.isDefault ? ' · Varsayılan' : ''}
                  </AppText>
                </View>
                <AppText color={theme.colors.muted}>›</AppText>
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Card>
          <AppText color={theme.colors.muted}>
            Henüz kayıtlı tasarımınız yok. Aşağıdan bir şablon seçerek başlayın.
          </AppText>
        </Card>
      )}
      <SectionHeader title="Şablonlar" />
      <View style={styles.grid}>
        {sampleDesigns.map((sample) => {
          const template = templateById(sample.templateId);
          return (
            <Pressable
              key={sample.id}
              accessibilityRole="button"
              accessibilityLabel={`${template.name} şablonunu kullan. ${template.description}`}
              onPress={() => router.push(`/invitation-editor?template=${template.id}`)}
              style={styles.thumb}
            >
              <ScaledInvitation
                width={THUMB_WIDTH}
                content={resolveInvitationContent(sample, data.profile)}
                template={template}
                palette={paletteById(sample.paletteId)}
              />
              <AppText variant="label">{template.name}</AppText>
              <AppText variant="caption" color={theme.colors.muted}>
                {template.description}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <Button
        label="Davetliye davetiye gönder"
        onPress={() => router.push('/invite-send')}
        disabled={!data.guests.length}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  thumb: { width: THUMB_WIDTH, gap: spacing.xs },
  designRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  designCopy: { flex: 1, gap: 2 },
});
