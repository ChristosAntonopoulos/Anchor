import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { CompleteBehavioralActivityRequest } from '../../types';

interface ActivityCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (request: CompleteBehavioralActivityRequest) => Promise<void>;
  activityTitle: string;
}

export function ActivityCompletionModal({
  visible,
  onClose,
  onSubmit,
  activityTitle,
}: ActivityCompletionModalProps) {
  const [moodBefore, setMoodBefore] = useState<number | undefined>(undefined);
  const [moodAfter, setMoodAfter] = useState<number | undefined>(undefined);
  const [pleasureRating, setPleasureRating] = useState<number | undefined>(undefined);
  const [masteryRating, setMasteryRating] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        moodBefore,
        moodAfter,
        pleasureRating,
        masteryRating,
        notes: notes.trim() || undefined,
      });
      // Reset form
      setMoodBefore(undefined);
      setMoodAfter(undefined);
      setPleasureRating(undefined);
      setMasteryRating(undefined);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to complete activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const RatingSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
  }) => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              { width: value !== undefined ? `${(value / 10) * 100}%` : '0%' },
            ]}
          />
        </View>
        <View style={styles.sliderButtons}>
          {[0, 2, 4, 6, 8, 10].map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.sliderButton,
                value === val && styles.sliderButtonActive,
              ]}
              onPress={() => onChange(val)}
            >
              <Text
                style={[
                  styles.sliderButtonText,
                  value === val && styles.sliderButtonTextActive,
                ]}
              >
                {val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {value !== undefined && (
        <Text style={styles.ratingValue}>{value}/10</Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Complete Activity</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AppIcon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.activityTitle}>{activityTitle}</Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <RatingSlider
              label="Mood Before"
              value={moodBefore}
              onChange={setMoodBefore}
            />
            <RatingSlider
              label="Mood After"
              value={moodAfter}
              onChange={setMoodAfter}
            />
            <RatingSlider
              label="Pleasure Rating"
              value={pleasureRating}
              onChange={setPleasureRating}
            />
            <RatingSlider
              label="Mastery Rating"
              value={masteryRating}
              onChange={setMasteryRating}
            />

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="How did this activity make you feel?"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [colors.border, colors.border] : [colors.category.health, colors.category.health + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Completing...' : 'Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  activityTitle: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    marginBottom: spacing.m,
  },
  content: {
    paddingHorizontal: spacing.m,
    maxHeight: 500,
  },
  ratingContainer: {
    marginBottom: spacing.m,
  },
  ratingLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.s,
  },
  sliderContainer: {
    marginBottom: spacing.xs,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.s,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.category.health,
    borderRadius: 4,
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: colors.category.health + '20',
    borderColor: colors.category.health,
  },
  sliderButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  sliderButtonTextActive: {
    color: colors.category.health,
    fontWeight: typography.fontWeight.semibold,
  },
  ratingValue: {
    fontSize: typography.fontSize.caption,
    color: colors.category.health,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'right',
  },
  notesContainer: {
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  notesLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    padding: spacing.s,
    color: colors.textPrimary,
    fontSize: typography.fontSize.body,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.s,
    padding: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
