import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="consent" />
      <Stack.Screen name="location" />
      <Stack.Screen name="motivation" />
    </Stack>
  );
}
