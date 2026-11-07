import { Stack } from 'expo-router';
import { colors } from '../../constants/designTokens';

export default function WorkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="[blockId]" />
    </Stack>
  );
}
