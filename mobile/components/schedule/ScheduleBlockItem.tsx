import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';
import { ScheduleBlockEditModal } from './ScheduleBlockEditModal';

interface ScheduleBlockItemProps {
  block: ScheduleBlock;
  isCurrent?: boolean;
  onUpdate?: (updates: { title?: string; startTime?: string; endTime?: string }) => void;
}

export function ScheduleBlockItem({ block, isCurrent, onUpdate }: ScheduleBlockItemProps) {
  const [editVisible, setEditVisible] = useState(false);
  const gradientColors = isCurrent 
    ? [colors.category.work + '30', colors.category.work + '10']
    : ['#1E2530', '#252B38'];

  const canEdit = !isCurrent && onUpdate; // Only allow editing future blocks

  const handleSave = (updates: { title?: string; startTime?: string; endTime?: string }) => {
    if (onUpdate) {
      onUpdate(updates);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isCurrent && styles.currentContainer]}
        onLongPress={() => canEdit && setEditVisible(true)}
        activeOpacity={canEdit ? 0.7 : 1}
        disabled={!canEdit}
      >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isCurrent && styles.currentGradient]}
      >
        <View style={styles.timeContainer}>
          <Text style={[styles.time, isCurrent && styles.currentTime]}>{block.startTime}</Text>
          <Text style={[styles.timeSeparator, isCurrent && styles.currentTime]}>-</Text>
          <Text style={[styles.time, isCurrent && styles.currentTime]}>{block.endTime}</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isCurrent && styles.currentTitle]}>
            {block.title}
          </Text>
          {canEdit && (
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.textSecondary}
              style={styles.editIcon}
            />
          )}
        </View>
        {isCurrent && <View style={styles.glowIndicator} />}
      </LinearGradient>
      </TouchableOpacity>

      {canEdit && (
        <ScheduleBlockEditModal
          visible={editVisible}
          block={block}
          onClose={() => setEditVisible(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s,
    marginHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  currentContainer: {
    ...shadows.glow.work,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  currentGradient: {
    borderColor: colors.category.work + '60',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  editIcon: {
    marginLeft: spacing.xs,
  },
  time: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  currentTime: {
    color: colors.category.work,
  },
  timeSeparator: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  currentTitle: {
    color: colors.category.work,
  },
  glowIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.category.work,
    opacity: 0.8,
  },
});
