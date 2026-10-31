import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { ensureUnlockPromptRunning } from 'phone-unlock';

export default function RootLayout() {
  useEffect(() => {
    ensureUnlockPromptRunning();
  }, []);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="more" />
      </Stack>
    </ErrorBoundary>
  );
}
