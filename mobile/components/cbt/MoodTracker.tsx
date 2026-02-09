import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCBTStore } from '../../store/useCBTStore';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

const MOODS = [
  { label: 'Happy', value: 'happy', icon: 'happy-outline', color: colors.category.leverage },
  { label: 'Anxious', value: 'anxious', icon: 'alert-circle-outline', color: colors.category.work },
  { label: 'Sad', value: 'sad', icon: 'sad-outline', color: colors.category.stability },
  { label: 'Angry', value: 'angry', icon: 'flame-outline', color: '#EF4444' },
  { label: 'Calm', value: 'calm', icon: 'leaf-outline', color: colors.category.health },
  { label: 'Excited', value: 'excited', icon: 'flash-outline', color: colors.category.leverage },
  { label: 'Tired', value: 'tired', icon: 'moon-outline', color: colors.textSecondary },
  { label: 'Confused', value: 'confused', icon: 'help-circle-outline', color: colors.textSecondary },
];

export function MoodTracker() {
  const { moodEntries, createMoodEntry, fetchMoodEntries, loading } = useCBTStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    fetchMoodEntries(today, endDate.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async () => {
    if (!selectedMood) return;

    const today = new Date().toISOString().split('T')[0];
    await createMoodEntry({
      date: today,
      mood: selectedMood,
      intensity,
      notes: notes.trim() || undefined,
    });

    setSelectedMood(null);
    setIntensity(5);
    setNotes('');
  };

  return (
    <View style={styles.container}>
      {/* Quick Mood Entry */}
      <View style={styles.entryCard}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.title}>How are you feeling?</Text>

          {/* Mood Selection */}
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && styles.moodButtonSelected,
                  selectedMood === mood.value && { borderColor: mood.color },
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Ionicons
                  name={mood.icon as any}
                  size={24}
                  color={selectedMood === mood.value ? mood.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.moodLabel,
                    selectedMood === mood.value && { color: mood.color },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Intensity Slider */}
          {selectedMood && (
            <View style={styles.intensityContainer}>
              <Text style={styles.intensityLabel}>Intensity: {intensity}/10</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${(intensity / 10) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.sliderButtons}>
                  {[1, 3, 5, 7, 9, 10].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sliderButton,
                        intensity === value && styles.sliderButtonActive,
                      ]}
                      onPress={() => setIntensity(value)}
                    >
                      <Text
                        style={[
                          styles.sliderButtonText,
                          intensity === value && styles.sliderButtonTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {selectedMood && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={500}
              />
            </View>
          )}

          {/* Submit Button */}
          {selectedMood && (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? [colors.border, colors.border] : [colors.category.health, colors.category.health + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>Log Mood</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      {/* Recent Moods */}
      {moodEntries.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Moods</Text>
          {moodEntries.slice(0, 7).map((entry) => {
            const mood = MOODS.find((m) => m.value === entry.mood);
            return (
              <View key={entry.id} style={styles.recentItem}>
                <View style={styles.recentItemLeft}>
                  <Ionicons
                    name={mood?.icon as any || 'ellipse-outline'}
                    size={20}
                    color={mood?.color || colors.textSecondary}
                  />
                  <Text style={styles.recentDate}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.recentItemRight}>
                  <Text style={styles.recentMood}>{entry.mood}</Text>
                  <Text style={styles.recentIntensity}>{entry.intensity}/10</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
  },
  entryCard: {
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
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  moodButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  moodButtonSelected: {
    borderWidth: 2,
  },
  moodLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  intensityContainer: {
    marginTop: spacing.m,
  },
  intensityLabel: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.s,
    fontWeight: typography.fontWeight.medium,
  },
  sliderContainer: {
    marginBottom: spacing.m,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.s,
    position: 'relative',
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontWeight: typography.fontWeight.medium,
  },
  sliderButtonTextActive: {
    color: colors.category.health,
    fontWeight: typography.fontWeight.semibold,
  },
  notesContainer: {
    marginTop: spacing.m,
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
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    marginTop: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  submitButtonDisabled: {
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
  recentContainer: {
    marginTop: spacing.xl,
  },
  recentTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  recentDate: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  recentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  recentMood: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  recentIntensity: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
});
