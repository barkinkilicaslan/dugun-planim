import { Redirect } from 'expo-router';
import { useApp } from '@/context/app-context';

export default function Index() {
  const { data } = useApp();
  return <Redirect href={data.profile.onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}
