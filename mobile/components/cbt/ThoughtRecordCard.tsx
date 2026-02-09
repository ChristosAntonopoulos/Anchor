import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { CBTEntry } from '../../types';

interface ThoughtRecordCardProps {
  entry: CBTEntry;
  onPress?: () => void;
}

export function ThoughtRecordCard({ entry, onPress }: ThoughtRecordCardProps) {
  const isCompleted = entry.status === 'completed';
  const hasThoughts = entry.automaticThoughts && entry.automaticThoughts.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Status Badge */}
        <View style={styles.header}>
          <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
            <Text style={[styles.statusText, isCompleted && styles.statusTextCompleted]}>
              {entry.status === 'pending' ? 'Processing...' : 
               entry.status === 'processing' ? 'Analyzing...' :
               entry.status === 'completed' ? 'Completed' : 'Failed'}
            </Text>
          </View>
          <Text style={styles.date}>
            {new Date(entry.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Original Text */}
        <Text style={styles.originalText} numberOfLines={3}>
          {entry.text}
        </Text>

        {/* Mood */}
        {entry.mood && (
          <View style={styles.moodRow}>
            <Ionicons name="heart-outline" size={16} color={colors.category.health} />
            <Text style={styles.moodText}>
              {entry.mood} {entry.moodIntensity !== undefined && `(${entry.moodIntensity}/10)`}
            </Text>
          </View>
        )}

        {/* Situation */}
        {entry.situation && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Situation:</Text>
            <Text style={styles.sectionText}>{entry.situation}</Text>
          </View>
        )}

        {/* Automatic Thoughts Preview */}
        {hasThoughts && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Automatic Thoughts:</Text>
            {entry.automaticThoughts?.slice(0, 2).map((thought, idx) => (
              <Text key={idx} style={styles.thoughtText} numberOfLines={1}>
                • {thought.text}
              </Text>
            ))}
            {entry.automaticThoughts && entry.automaticThoughts.length > 2 && (
              <Text style={styles.moreText}>
                +{entry.automaticThoughts.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Cognitive Distortions */}
        {entry.cognitiveDistortions && entry.cognitiveDistortions.length > 0 && (
          <View style={styles.distortionsContainer}>
            {entry.cognitiveDistortions.slice(0, 3).map((distortion, idx) => (
              <View key={idx} style={styles.distortionTag}>
                <Text style={styles.distortionText}>{distortion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Insights Preview */}
        {entry.aiInsights && (
          <View style={styles.insightsContainer}>
            <Ionicons name="bulb-outline" size={16} color={colors.category.leverage} />
            <Text style={styles.insightsText} numberOfLines={2}>
              {entry.aiInsights}
            </Text>
          </View>
        )}

        {onPress && (
          <View style={styles.footer}>
            <Text style={styles.viewMore}>Tap to view full record →</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    backgroundColor: colors.category.health + '20',
    borderWidth: 1,
    borderColor: colors.category.health + '40',
  },
  statusBadgeCompleted: {
    backgroundColor: colors.category.leverage + '20',
    borderColor: colors.category.leverage + '40',
  },
  statusText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.health,
    fontWeight: typography.fontWeight.medium,
  },
  statusTextCompleted: {
    color: colors.category.leverage,
  },
  date: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  originalText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.s,
    lineHeight: 20,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.xs,
  },
  moodText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.health,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    marginTop: spacing.s,
  },
  sectionLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  thoughtText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    lineHeight: 18,
  },
  moreText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  distortionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.s,
  },
  distortionTag: {
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    backgroundColor: colors.category.work + '20',
    borderWidth: 1,
    borderColor: colors.category.work + '40',
  },
  distortionText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
  },
  insightsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.s,
    gap: spacing.xs,
    padding: spacing.s,
    backgroundColor: colors.category.leverage + '10',
    borderRadius: borderRadius.small,
  },
  insightsText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: spacing.s,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewMore: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
