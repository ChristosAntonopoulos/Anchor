import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { Notification } from '../../types';

interface CreateTaskButtonProps {
  notification: Notification;
  onPress?: () => void;
}

export function CreateTaskButton({ notification, onPress }: CreateTaskButtonProps) {
  const handlePress = () => {
    // UI only - no processing
    console.log('Create task from notification:', notification);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient
        colors={[colors.category.work, colors.category.work + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.background} />
        <Text style={styles.buttonText}>Create Task</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    gap: spacing.s,
  },
  buttonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
