import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { NowRecommendation } from '../../types';
import type { CapacityChoice } from '../../types/execution';

interface NowCardProps {
  recommendation: NowRecommendation | null;
  loading?: boolean;
  onStart: () => void;
  onMakeSmaller: () => void;
  onChooseSomethingElse: () => void;
  onCapacity: (capacity: CapacityChoice) => void;
  onEasier: () => void;
  onPlanToday: () => void;
}

const CAPACITY: { id: CapacityChoice; label: string }[] = [
  { id: '5', label: '5 min' },
  { id: '15', label: '15 min' },
  { id: '30', label: '30+' },
  { id: 'unsure', label: '?' },
];

export function NowCard({
  recommendation,
  loading,
  onStart,
  onMakeSmaller,
  onChooseSomethingElse,
  onCapacity,
  onEasier,
  onPlanToday,
}: NowCardProps) {
  const inSession = Boolean(recommendation?.activeSession);
  const title = recommendation?.taskTitle?.trim() || (loading ? 'Looking at the day…' : 'Choose one thing');
  const action = recommendation?.nextAction?.trim();
  const showAction = Boolean(action && action !== title);
  const canStart = Boolean(recommendation?.activeSession || recommendation?.taskId || recommendation?.nextAction);
  const reason = inSession
    ? 'A session is already open.'
    : recommendation?.reason;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Now</Text>
        <Text style={styles.title}>{title}</Text>
        {showAction ? <Text style={styles.action}>{action}</Text> : null}
        {reason ? <Text style={styles.reason}>{reason}</Text> : null}

        <TouchableOpacity
          style={[styles.start, !canStart && styles.startDisabled]}
          onPress={onStart}
          disabled={!canStart}
          accessibilityRole="button"
          accessibilityLabel={
            inSession
              ? 'Continue session'
              : `Start for ${recommendation?.suggestedStartMinutes ?? 5} minutes`
          }
        >
          <Text style={styles.startText}>
            {inSession
              ? 'Continue session'
              : `Start · ${recommendation?.suggestedStartMinutes ?? 5} min`}
          </Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.ghost} onPress={onMakeSmaller}>
            <Text style={styles.ghostText}>Smaller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghost} onPress={onChooseSomethingElse}>
            <Text style={styles.ghostText}>Something else</Text>
          </TouchableOpacity>
        </View>

        {inSession ? null : (
          <>
            <View style={styles.chips}>
              {CAPACITY.map((item) => (
                <TouchableOpacity key={item.id} style={styles.chip} onPress={() => onCapacity(item.id)}>
                  <Text style={styles.chipText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.links}>
              <TouchableOpacity onPress={onEasier} accessibilityRole="button">
                <Text style={styles.link}>Easier start</Text>
              </TouchableOpacity>
              <Text style={styles.dot}>·</Text>
              <TouchableOpacity onPress={onPlanToday} accessibilityRole="button">
                <Text style={styles.link}>Plan today</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.l, marginBottom: spacing.m },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.small,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 26,
  },
  action: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.body,
  },
  reason: {
    color: colors.textMuted,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
  start: {
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startDisabled: {
    backgroundColor: colors.primaryPressed,
  },
  startText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  row: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
  ghost: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.m },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
  },
  chipText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  link: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
  },
  dot: {
    color: colors.textMuted,
  },
});
