import { Stack } from 'expo-router';
import { colors, typography } from '../../constants/designTokens';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.semibold,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="money"
        options={{
          title: 'Money',
        }}
      />
      <Stack.Screen
        name="deadlines"
        options={{
          title: 'Deadlines',
        }}
      />
      <Stack.Screen
        name="weekly-review"
        options={{
          title: 'Weekly Review',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Stack>
  );
}
