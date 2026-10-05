import { Redirect } from 'expo-router';
import { useApp } from '@/context/app-context';
import { useThemeControls } from '@/context/theme-context';

/** Açılış kapısı: kayıtlı tarz yoksa önce "Tarzını seç", sonra onboarding veya ana sayfa. */
export default function Index() {
  const { data } = useApp();
  const { hasChosen } = useThemeControls();
  if (!hasChosen) return <Redirect href="/style-select" />;
  return <Redirect href={data.profile.onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}
