import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="budget-alert" options={{ headerShown: false }} />
          <Stack.Screen name="history" options={{ headerShown: false }} />
          <Stack.Screen name="expense-detail" options={{ headerShown: false }} />
          <Stack.Screen name="review-expense" options={{ headerShown: false }} />
          <Stack.Screen name="modal"  options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <AuthRedirect />
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const { initialized, initializeAuth, session } = useAuth();

  useEffect(() => initializeAuth(), [initializeAuth]);

  useEffect(() => {
    if (!initialized) return;

    const firstSegment = segments[0];
    const isAuthRoute = firstSegment === 'login' || firstSegment === 'register';

    if (!session && !isAuthRoute) {
      router.replace('/login');
      return;
    }

    if (session && isAuthRoute) {
      router.replace('/');
    }
  }, [initialized, router, segments, session]);

  return null;
}
