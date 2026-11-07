import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { AiBrief } from '../../types';

interface AiBriefCardProps {
  brief: AiBrief;
  onMarkApplied?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: colors.category.work,
  leverage: colors.category.leverage,
  health: colors.category.health,
  stability: colors.category.stability,
};

export function AiBriefCard({ brief, onMarkApplied }: AiBriefCardProps) {
  const [expanded, setExpanded] = useState(false);
  const categoryColor = brief.focusCategory
    ? (CATEGORY_COLORS[brief.focusCategory] ?? colors.category.stability)
    : colors.category.stability;
  const assessment = brief.yesterdayAssessment;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${categoryColor}18`, `${categoryColor}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: `${categoryColor}40` }]}
      >
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: categoryColor }]} />

        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.label}>AI Daily Brief</Text>
            {brief.focusCategory && (
              <View style={[styles.focusBadge, { backgroundColor: `${categoryColor}25` }]}>
                <Text style={[styles.focusBadgeText, { color: categoryColor }]}>
                  Focus: {brief.focusCategory}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.chevron, { color: categoryColor }]}>
            {expanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {/* Summary (always visible) */}
        {assessment?.summary && (
          <Text style={styles.summary} numberOfLines={expanded ? undefined : 2}>
            {assessment.summary}
          </Text>
        )}

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expandedContent}>
            {/* Wins */}
            {assessment?.wins && assessment.wins.length > 0 && (
              <Section title="Wins" color="#10D9A0" items={assessment.wins} prefix="✓" />
            )}

            {/* Misses */}
            {assessment?.misses && assessment.misses.length > 0 && (
              <Section title="Misses" color="#FF6B6B" items={assessment.misses} prefix="✗" />
            )}

            {/* Carry forward */}
            {assessment?.carryForward && assessment.carryForward.length > 0 && (
              <Section
                title="Carry Forward"
                color="#FFB84D"
                items={assessment.carryForward}
                prefix="→"
              />
            )}

            {/* Today's focus tasks */}
            {brief.todayFocusTasks.length > 0 && (
              <Section
                title="Today's Focus"
                color={categoryColor}
                items={brief.todayFocusTasks}
                prefix="·"
              />
            )}

            {/* Diet note */}
            {assessment?.dietNote && (
              <View style={styles.noteRow}>
                <Text style={styles.noteLabel}>Diet:</Text>
                <Text style={styles.noteText}>{assessment.dietNote}</Text>
              </View>
            )}

            {/* Mood note */}
            {assessment?.moodNote && (
              <View style={styles.noteRow}>
                <Text style={styles.noteLabel}>Mood:</Text>
                <Text style={styles.noteText}>{assessment.moodNote}</Text>
              </View>
            )}

            {/* Mark applied button */}
            {!brief.applied && onMarkApplied && (
              <TouchableOpacity
                style={[styles.applyButton, { borderColor: categoryColor }]}
                onPress={onMarkApplied}
                activeOpacity={0.8}
              >
                <Text style={[styles.applyButtonText, { color: categoryColor }]}>
                  Mark as Applied
                </Text>
              </TouchableOpacity>
            )}

            {brief.applied && (
              <Text style={styles.appliedLabel}>✓ Applied</Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function Section({
  title,
  color,
  items,
  prefix,
}: {
  title: string;
  color: string;
  items: string[];
  prefix: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.sectionItem}>
          <Text style={{ color }}>{prefix} </Text>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  card: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    overflow: 'hidden',
    paddingLeft: spacing.m + 4, // room for accent bar
    paddingRight: spacing.m,
    paddingVertical: spacing.m,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    flexShrink: 1,
  },
  label: {
    fontSize: typography.fontSize.small,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  focusBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  focusBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 10,
  },
  summary: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  expandedContent: {
    marginTop: spacing.s,
  },
  section: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  sectionItem: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 2,
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  noteLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  noteText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  applyButton: {
    marginTop: spacing.m,
    borderWidth: 1,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  appliedLabel: {
    marginTop: spacing.s,
    fontSize: typography.fontSize.caption,
    color: '#10D9A0',
    textAlign: 'center',
  },
});
