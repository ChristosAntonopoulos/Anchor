import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../icons/AppIcon';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../../constants/designTokens';
import type { RecurrencePattern } from '../../types';

interface RecurrencePickerProps {
  visible: boolean;
  recurrence: RecurrencePattern | undefined;
  onClose: () => void;
  onSave: (recurrence: RecurrencePattern | undefined) => void;
}

export function RecurrencePicker({ visible, recurrence, onClose, onSave }: RecurrencePickerProps) {
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>();

  useEffect(() => {
    if (recurrence) {
      setType(recurrence.type);
      setInterval(recurrence.interval || 1);
      setDaysOfWeek(recurrence.daysOfWeek || []);
      setDayOfMonth(recurrence.dayOfMonth);
    }
  }, [recurrence]);

  const handleSave = () => {
    const pattern: RecurrencePattern = {
      type,
      interval: interval > 1 ? interval : undefined,
      daysOfWeek: type === 'weekly' && daysOfWeek.length > 0 ? daysOfWeek : undefined,
      dayOfMonth: type === 'monthly' ? dayOfMonth : undefined,
    };
    onSave(pattern);
    onClose();
  };

  const handleClear = () => {
    onSave(undefined);
    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const recurrenceTypes = [
    { value: 'daily' as const, label: 'Daily' },
    { value: 'weekly' as const, label: 'Weekly' },
    { value: 'monthly' as const, label: 'Monthly' },
    { value: 'yearly' as const, label: 'Yearly' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={gradients.background.colors}
        start={gradients.background.start}
        end={gradients.background.end}
        style={styles.container}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AppIcon name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Repeat</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Recurrence Type */}
            <View style={styles.section}>
              <Text style={styles.label}>Repeat Type</Text>
              <View style={styles.typeRow}>
                {recurrenceTypes.map((rt) => (
                  <TouchableOpacity
                    key={rt.value}
                    onPress={() => setType(rt.value)}
                    activeOpacity={0.7}
                  >
                    {type === rt.value ? (
                      <LinearGradient
                        colors={[colors.category.work, colors.category.work + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.typeChipActive}
                      >
                        <Text style={styles.typeChipTextActive}>{rt.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.typeChip}>
                        <Text style={styles.typeChipText}>{rt.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interval */}
            {type !== 'yearly' && (
              <View style={styles.section}>
                <Text style={styles.label}>Every</Text>
                <View style={styles.intervalRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setInterval(val)}
                      activeOpacity={0.7}
                    >
                      {interval === val ? (
                        <View style={styles.intervalChipActive}>
                          <Text style={styles.intervalChipTextActive}>{val}</Text>
                        </View>
                      ) : (
                        <View style={styles.intervalChip}>
                          <Text style={styles.intervalChipText}>{val}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.intervalLabel}>
                  {type === 'daily' && interval > 1 ? 'days' : type === 'weekly' && interval > 1 ? 'weeks' : type === 'monthly' && interval > 1 ? 'months' : type}
                </Text>
              </View>
            )}

            {/* Days of Week (for weekly) */}
            {type === 'weekly' && (
              <View style={styles.section}>
                <Text style={styles.label}>Days of Week</Text>
                <View style={styles.daysRow}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => toggleDayOfWeek(day.value)}
                      activeOpacity={0.7}
                    >
                      {daysOfWeek.includes(day.value) ? (
                        <LinearGradient
                          colors={[colors.category.work, colors.category.work + 'CC']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.dayChipActive}
                        >
                          <Text style={styles.dayChipTextActive}>{day.label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.dayChip}>
                          <Text style={styles.dayChipText}>{day.label}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Day of Month (for monthly) */}
            {type === 'monthly' && (
              <View style={styles.section}>
                <Text style={styles.label}>Day of Month</Text>
                <View style={styles.monthDaysRow}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setDayOfMonth(dayOfMonth === day ? undefined : day)}
                      activeOpacity={0.7}
                    >
                      {dayOfMonth === day ? (
                        <View style={styles.monthDayChipActive}>
                          <Text style={styles.monthDayChipTextActive}>{day}</Text>
                        </View>
                      ) : (
                        <View style={styles.monthDayChip}>
                          <Text style={styles.monthDayChipText}>{day}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Clear Button */}
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Remove Repeat</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  content: {
    flex: 1,
    padding: spacing.l,
  },
  section: {
    marginBottom: spacing.l,
  },
  label: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  typeChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
  },
  typeChipText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  typeChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  intervalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  intervalChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 40,
    alignItems: 'center',
  },
  intervalChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: colors.category.work,
    backgroundColor: colors.surface,
    minWidth: 40,
    alignItems: 'center',
  },
  intervalChipText: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  intervalChipTextActive: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  intervalLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: spacing.s,
    fontStyle: 'italic',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  dayChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 50,
    alignItems: 'center',
  },
  dayChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    minWidth: 50,
    alignItems: 'center',
  },
  dayChipText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  dayChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  monthDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  monthDayChip: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 40,
    alignItems: 'center',
  },
  monthDayChipActive: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.category.work,
    backgroundColor: colors.surface,
    minWidth: 40,
    alignItems: 'center',
  },
  monthDayChipText: {
    fontSize: typography.fontSize.caption,
    color: colors.textPrimary,
  },
  monthDayChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  clearButton: {
    marginTop: spacing.l,
    padding: spacing.m,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.error,
    fontWeight: typography.fontWeight.semibold,
  },
});
