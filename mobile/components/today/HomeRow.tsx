import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

interface HomeRowProps {
  icon: string;
  label: string;
  title: string;
  meta?: string;
  onPress?: () => void;
}

export function HomeRow({ icon, label, title, meta, onPress }: HomeRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'summary'}
    >
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={18} color={colors.textSecondary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {onPress ? <AppIcon name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.s,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  meta: {
    marginTop: 2,
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
