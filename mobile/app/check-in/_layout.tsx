import { Stack } from 'expo-router';
import { colors, typography } from '../../constants/designTokens';

export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: typography.fontWeight.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="capture" options={{ title: 'Check-in' }} />
      <Stack.Screen name="support" options={{ title: 'Choose support' }} />
      <Stack.Screen name="thought" options={{ title: 'Understand a thought' }} />
      <Stack.Screen name="problem" options={{ title: 'Work through a problem' }} />
      <Stack.Screen name="activity" options={{ title: 'Choose a small step' }} />
      <Stack.Screen name="grounding" options={{ title: 'Settle for a moment' }} />
      <Stack.Screen name="steps" options={{ title: 'My steps' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="[id]" options={{ title: 'Check-in' }} />
    </Stack>
  );
}
