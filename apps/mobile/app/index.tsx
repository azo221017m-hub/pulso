import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { View } from '@/components/Themed';
import { useAuth } from '@/lib/auth-context';
import { isOnboardingComplete } from '@/lib/onboarding';

export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      return;
    }
    isOnboardingComplete(user.id).then((done) => {
      setOnboardingDone(done);
      setCheckingOnboarding(false);
    });
  }, [user]);

  if (isLoading || (isAuthenticated && checkingOnboarding)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!onboardingDone) return <Redirect href="/(onboarding)/consent" />;
  return <Redirect href="/(tabs)/home" />;
}
