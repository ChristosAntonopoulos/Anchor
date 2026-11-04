import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#1E2530', '#252B38']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <Text style={styles.kicker}>What helps me now?</Text>
        {recommendation?.taskTitle ? (
          <Text style={styles.title}>{recommendation.taskTitle}</Text>
        ) : (
          <Text style={styles.title}>{loading ? 'Looking at the day…' : 'Choose one thing to move forward.'}</Text>
        )}
        {recommendation?.nextAction ? (
          <Text style={styles.action}>{recommendation.nextAction}</Text>
        ) : null}
        {recommendation?.reason ? <Text style={styles.reason}>{recommendation.reason}</Text> : null}

        <TouchableOpacity style={styles.start} onPress={onStart} disabled={!recommendation?.activeSession && !recommendation?.taskId && !recommendation?.nextAction}>
          <LinearGradient
            colors={[colors.category.work, colors.category.work + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Text style={styles.startText}>
              {recommendation?.activeSession
                ? 'Continue session'
                : `Start for ${recommendation?.suggestedStartMinutes ?? 5} minutes`}
            </Text>
          </LinearGradient>
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
        <TouchableOpacity onPress={onEasier}>
          <Text style={styles.link}>Need an easier start?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPlanToday}>
          <Text style={styles.link}>Help me plan today</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.l, marginBottom: spacing.m },
  card: {
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  kicker: {
    color: colors.category.work,
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.s,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
  },
  action: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    marginTop: spacing.s,
  },
  reason: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
  },
  start: { marginTop: spacing.m, borderRadius: borderRadius.medium, overflow: 'hidden' },
  startGradient: { padding: spacing.m, alignItems: 'center' },
  startText: {
    color: colors.background,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  row: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
  ghost: {
    flex: 1,
    padding: spacing.s,
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  subtle: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: spacing.m },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
  },
  chipText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  link: {
    color: colors.category.stability,
    fontSize: typography.fontSize.caption,
    marginTop: spacing.s,
    textDecorationLine: 'underline',
  },
});
