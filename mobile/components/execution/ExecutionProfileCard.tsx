import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SESSION_DURATIONS } from '../../utils/execution';
import type { ExecutionProfile } from '../../types';
import type { ExecutionReview, TimerStyle } from '../../types/execution';

interface ExecutionProfileCardProps {
  profile: ExecutionProfile;
  onChange: (patch: Partial<ExecutionProfile>) => void;
  review?: ExecutionReview | null;
  onReview?: () => void;
}

export function ExecutionProfileCard({ profile, onChange, review, onReview }: ExecutionProfileCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Personal execution</Text>
      <Text style={styles.help}>
        Explicit preferences here are treated as defaults. Observations and guesses stay separate.
      </Text>
      <Text style={styles.label}>Initial session</Text>
      <View style={styles.row}>
        {SESSION_DURATIONS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[styles.chip, profile.preferredInitialSessionMinutes === minutes && styles.chipOn]}
            onPress={() => onChange({ preferredInitialSessionMinutes: minutes })}
          >
            <Text style={styles.chipText}>{minutes}m</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Timer</Text>
      <View style={styles.row}>
        {(['countdown', 'elapsed', 'none'] as TimerStyle[]).map((style) => (
          <TouchableOpacity
            key={style}
            style={[styles.chip, profile.preferredTimerStyle === style && styles.chipOn]}
            onPress={() => onChange({ preferredTimerStyle: style })}
          >
            <Text style={styles.chipText}>{style}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Countdowns feel helpful</Text>
        <Switch
          value={profile.countdownsFeelHelpful}
          onValueChange={(countdownsFeelHelpful) => onChange({ countdownsFeelHelpful })}
          trackColor={{ false: colors.border, true: colors.category.work }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Break reminders</Text>
        <Switch
          value={profile.breakReminders}
          onValueChange={(breakReminders) => onChange({ breakReminders })}
          trackColor={{ false: colors.border, true: colors.category.work }}
        />
      </View>
      <Text style={styles.label}>AI prompting</Text>
      <View style={styles.row}>
        {(['quieter', 'normal', 'more'] as const).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.chip, profile.aiPromptingLevel === level && styles.chipOn]}
            onPress={() => onChange({ aiPromptingLevel: level })}
          >
            <Text style={styles.chipText}>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {profile.statedObstacles.length > 0 ? (
        <Text style={styles.note}>Starting assumption: {profile.statedObstacles.join(' ')}</Text>
      ) : null}
      {profile.observations[0] ? (
        <Text style={styles.note}>Observation: {profile.observations[0].text}</Text>
      ) : null}
      {profile.hypotheses[0] ? (
        <Text style={styles.hypothesis}>Hypothesis: {profile.hypotheses[0].text}</Text>
      ) : null}
      {onReview ? (
        <TouchableOpacity style={styles.reviewBtn} onPress={onReview}>
          <Text style={styles.chipText}>Look at recent patterns</Text>
        </TouchableOpacity>
      ) : null}
      {review?.observations[0] ? (
        <Text style={styles.note}>{review.observations[0]}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.title, fontWeight: typography.fontWeight.semibold },
  help: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: spacing.s, marginBottom: spacing.m },
  label: { color: colors.textSecondary, fontSize: typography.fontSize.caption, marginTop: spacing.s },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s },
  chip: { paddingHorizontal: spacing.m, paddingVertical: spacing.xs, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: '#31443C', borderColor: colors.category.leverage },
  chipText: { color: colors.textPrimary, fontSize: typography.fontSize.caption },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.m },
  switchLabel: { color: colors.textPrimary, flex: 1, paddingRight: spacing.s },
  note: { color: colors.textSecondary, marginTop: spacing.m, fontSize: typography.fontSize.caption },
  hypothesis: { color: colors.textSecondary, marginTop: spacing.s, fontSize: typography.fontSize.caption, fontStyle: 'italic' },
  reviewBtn: { marginTop: spacing.m, alignItems: 'center', padding: spacing.s, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
});
