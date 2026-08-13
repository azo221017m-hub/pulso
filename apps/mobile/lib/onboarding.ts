import AsyncStorage from '@react-native-async-storage/async-storage';

function key(userId: string) {
  return `pulso_onboarding_done_${userId}`;
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(key(userId))) === 'true';
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await AsyncStorage.setItem(key(userId), 'true');
}
