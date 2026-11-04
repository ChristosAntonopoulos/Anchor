import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { RecoveryCard as RecoveryCardData } from '../../types';

interface RecoveryCardProps {
  card: RecoveryCardData;
  onShorter: () => void;
  onMove: () => void;
  onLeave: () => void;
  onReplan: () => void;
}

export function RecoveryCard({ card, onShorter, onMove, onLeave, onReplan }: RecoveryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{card.message}</Text>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.action}>{card.nextAction}</Text>
      <TouchableOpacity style={styles.primary} onPress={onShorter}>
        <Text style={styles.primaryText}>Start a shorter session</Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <TouchableOpacity style={styles.ghost} onPress={onMove}><Text style={styles.ghostText}>Move this</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={onLeave}><Text style={styles.ghostText}>Leave it today</Text></TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onReplan}>
        <Text style={styles.link}>Replan the rest of today</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    padding: spacing.m,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: { color: colors.category.health, fontSize: typography.fontSize.caption, marginBottom: spacing.xs },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.body, fontWeight: typography.fontWeight.semibold },
  action: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: 4 },
  primary: {
    marginTop: spacing.m,
    backgroundColor: colors.category.health,
    borderRadius: borderRadius.medium,
    padding: spacing.s,
    alignItems: 'center',
  },
  primaryText: { color: colors.background, fontWeight: typography.fontWeight.semibold },
  row: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
  ghost: { flex: 1, padding: spacing.s, alignItems: 'center', borderRadius: borderRadius.medium, borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  link: { color: colors.category.stability, marginTop: spacing.s, textDecorationLine: 'underline', fontSize: typography.fontSize.caption },
});
