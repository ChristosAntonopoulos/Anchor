import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface SystemTileProps {
  icon: string;
  title: string;
  status: string;
  onPress: () => void;
  wide?: boolean;
  attention?: boolean;
}

export function SystemTile({ icon, title, status, onPress, wide, attention }: SystemTileProps) {
  return (
    <TouchableOpacity
      style={[styles.tile, wide && styles.wide, attention && styles.attention]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${status}`}
    >
      <View style={styles.icon}>
        <AppIcon name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.status, attention && styles.statusAttention]} numberOfLines={2}>
        {status}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 112,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.m,
  },
  attention: {
    borderColor: colors.warningContainer,
  },
  wide: {
    flex: undefined,
    width: '100%',
    minHeight: 88,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  status: {
    marginTop: 4,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusAttention: {
    color: colors.warning,
  },
});
