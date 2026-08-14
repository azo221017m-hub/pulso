import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { useNotificationResponseRouting } from '@/lib/notifications';
import { Tsq8FloatingButton } from '@/components/Tsq8/FloatingButton';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  useNotificationResponseRouting();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habits" options={{ title: 'PULSO Hábitos' }} />
        <Stack.Screen name="intervention/[sessionId]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="craving/new" options={{ title: 'Tengo ganas' }} />
        <Stack.Screen name="craving/[id]" options={{ title: 'Este momento' }} />
        <Stack.Screen name="evolution" options={{ title: 'Mi evolución' }} />
        <Stack.Screen name="emotional/index" options={{ title: 'PULSO Emocional' }} />
        <Stack.Screen name="emotional/session/[sessionId]" options={{ headerShown: false }} />
        <Stack.Screen name="emotional/tecnica/[intervencionId]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="emotional-evolution" options={{ title: 'Evolución emocional' }} />
        <Stack.Screen name="tsq8/[sessionId]" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
      {isAuthenticated && <Tsq8FloatingButton />}
    </ThemeProvider>
  );
}
