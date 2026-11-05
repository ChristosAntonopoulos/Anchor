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
  { id: 'unsure', label: 'Not sure' },
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
  const canStart = Boolean(recommendation?.activeSession || recommendation?.taskId || recommendation?.nextAction);

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.marker} />
        <Text style={styles.kicker}>Next action</Text>
        {recommendation?.taskTitle ? (
          <Text style={styles.title}>{recommendation.taskTitle}</Text>
        ) : (
          <Text style={styles.title}>{loading ? 'Looking at the day…' : 'Choose one thing to move forward.'}</Text>
        )}
        {recommendation?.nextAction ? (
          <Text style={styles.action}>{recommendation.nextAction}</Text>
        ) : null}
        {recommendation?.reason ? <Text style={styles.reason}>{recommendation.reason}</Text> : null}

        <TouchableOpacity
          style={[styles.start, !canStart && styles.startDisabled]}
          onPress={onStart}
          disabled={!canStart}
          accessibilityRole="button"
          accessibilityLabel={
            recommendation?.activeSession
              ? 'Continue session'
              : `Start for ${recommendation?.suggestedStartMinutes ?? 5} minutes`
          }
        >
          <Text style={styles.startText}>
            {recommendation?.activeSession
              ? 'Continue session'
              : `Start for ${recommendation?.suggestedStartMinutes ?? 5} minutes`}
          </Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity style={styles.ghost} onPress={onMakeSmaller}>
            <Text style={styles.ghostText}>Make smaller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghost} onPress={onChooseSomethingElse}>
            <Text style={styles.ghostText}>Choose something else</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtle}>How much room do you have?</Text>
        <View style={styles.chips}>
          {CAPACITY.map((item) => (
            <TouchableOpacity key={item.id} style={styles.chip} onPress={() => onCapacity(item.id)}>
              <Text style={styles.chipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={onEasier} accessibilityRole="button">
          <Text style={styles.link}>Need an easier start?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPlanToday} accessibilityRole="button">
          <Text style={styles.link}>Help me plan today</Text>
        </TouchableOpacity>
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
    paddingLeft: spacing.m + 6,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.small,
    overflow: 'hidden',
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  kicker: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.s,
    letterSpacing: 0.4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
  },
  action: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    marginTop: spacing.s,
    lineHeight: typography.lineHeight.body,
  },
  reason: {
    color: colors.textMuted,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  start: {
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    padding: spacing.m,
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
    padding: spacing.s,
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderControl,
  },
  ghostText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  subtle: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: spacing.m },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surfaceRaised,
  },
  chipText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  link: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
    textDecorationLine: 'underline',
  },
});
