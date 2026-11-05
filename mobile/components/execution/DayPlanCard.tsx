import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import type { DayPlan } from '../../types';

interface DayPlanCardProps {
  plan: DayPlan;
  onUse: () => void;
  onFirstOnly: () => void;
  onDiscard: () => void;
}

export function DayPlanCard({ plan, onUse, onFirstOnly, onDiscard }: DayPlanCardProps) {
  if (plan.status !== 'draft') {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Suggested plan</Text>
      <Text style={styles.summary}>{plan.summary}</Text>
      {plan.proposedBlocks.map((block, index) => (
        <View key={`${block.taskId}-${index}`} style={styles.block}>
          <Text style={styles.time}>{block.startLocal}–{block.endLocal}</Text>
          <Text style={styles.title}>{block.taskTitle ?? 'Work block'}</Text>
          <Text style={styles.action}>{block.entryAction}</Text>
          <Text style={styles.meta}>Start with {block.startMinutes} min{block.estimateUncertain ? ' · estimate uncertain' : ''}</Text>
        </View>
      ))}
      {plan.deadlineRisks.length > 0 ? (
        <Text style={styles.risk}>{plan.deadlineRisks.join(' ')}</Text>
      ) : null}
      {plan.assumptions.length > 0 ? (
        <Text style={styles.assume}>Assumption: {plan.assumptions[0]}</Text>
      ) : null}
      {plan.question ? <Text style={styles.question}>{plan.question}</Text> : null}
      <TouchableOpacity style={styles.primary} onPress={onUse}>
        <Text style={styles.primaryText}>Use plan</Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <TouchableOpacity style={styles.ghost} onPress={onFirstOnly}><Text style={styles.ghostText}>Keep only the first block</Text></TouchableOpacity>
        <TouchableOpacity style={styles.ghost} onPress={onDiscard}><Text style={styles.ghostText}>Adjust later</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    padding: spacing.m,
    borderRadius: borderRadius.large,
    backgroundColor: colors.aiContainer,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  kicker: { color: colors.aiAccent, fontSize: typography.fontSize.caption, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.s },
  summary: { color: colors.textPrimary, fontSize: typography.fontSize.body, marginBottom: spacing.s },
  block: { marginBottom: spacing.s },
  time: { color: colors.textSecondary, fontSize: typography.fontSize.caption },
  title: { color: colors.textPrimary, fontWeight: typography.fontWeight.semibold },
  action: { color: colors.textSecondary, fontSize: typography.fontSize.caption },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  risk: { color: colors.warning, fontSize: typography.fontSize.caption, marginTop: spacing.s },
  assume: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: spacing.s },
  question: { color: colors.textPrimary, marginTop: spacing.s },
  primary: { marginTop: spacing.m, backgroundColor: colors.primary, borderRadius: borderRadius.medium, padding: spacing.s, alignItems: 'center' },
  primaryText: { color: colors.onPrimary, fontWeight: typography.fontWeight.semibold },
  row: { gap: spacing.s, marginTop: spacing.s },
  ghost: { padding: spacing.s, alignItems: 'center', borderRadius: borderRadius.medium, borderWidth: 1, borderColor: colors.borderControl, backgroundColor: colors.surfaceRaised },
  ghostText: { color: colors.textPrimary, fontSize: typography.fontSize.caption, textAlign: 'center' },
});
