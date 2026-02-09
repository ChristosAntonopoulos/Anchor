import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../../constants/designTokens';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { Task, Subtask, Location, RecurrencePattern, CategoryName } from '../../types';
import { SubtaskList } from './SubtaskList';
import { LocationPicker } from './LocationPicker';
import { RecurrencePicker } from './RecurrencePicker';

interface TaskDetailModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => Promise<void>;
}

export function TaskDetailModal({ task, visible, onClose, onSave }: TaskDetailModalProps) {
  const { categories, fetchCategories, getCategoryColor } = useCategoryStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryName>('work');
  const [notes, setNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [location, setLocation] = useState<Location | undefined>();
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent' | undefined>();
  const [recurrence, setRecurrence] = useState<RecurrencePattern | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
      setNotes(task.notes || '');
      setPrivateNotes(task.privateNotes || '');
      setSubtasks(task.subtasks || []);
      setLocation(task.location);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setRecurrence(task.recurrence);
      setTags(task.tags || []);
      setEstimatedMinutes(task.estimatedMinutes);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        notes: notes.trim() || undefined,
        privateNotes: privateNotes.trim() || undefined,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        location,
        dueDate,
        priority,
        recurrence,
        tags: tags.length > 0 ? tags : undefined,
        estimatedMinutes,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = () => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: '',
      completed: false,
      order: subtasks.length,
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const handleUpdateSubtask = (id: string, updates: Partial<Subtask>) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, ...updates } : st));
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  // Use categories from store, fallback to hardcoded if not loaded
  const categoryList = categories.length > 0
    ? categories.map(cat => ({
        value: cat.name,
        label: cat.displayName,
        color: cat.color,
      }))
    : [
        { value: 'work', label: 'Work', color: colors.category.work },
        { value: 'leverage', label: 'Leverage', color: colors.category.leverage },
        { value: 'health', label: 'Health', color: colors.category.health },
        { value: 'stability', label: 'Stability', color: colors.category.stability },
      ];

  const priorities: { value: 'low' | 'medium' | 'high' | 'urgent'; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: colors.textSecondary },
    { value: 'medium', label: 'Medium', color: colors.category.work },
    { value: 'high', label: 'High', color: colors.category.health },
    { value: 'urgent', label: 'Urgent', color: '#EF4444' },
  ];

  if (!task) return null;

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Task</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!title.trim() || saving}
              style={[styles.saveButton, (!title.trim() || saving) && styles.saveButtonDisabled]}
            >
              <Text style={[styles.saveButtonText, (!title.trim() || saving) && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.section}>
              <TextInput
                style={styles.titleInput}
                placeholder="Task title"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {categoryList.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.7}
                  >
                    {category === cat.value ? (
                      <LinearGradient
                        colors={[cat.color, cat.color + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryChipActive}
                      >
                        <Text style={styles.categoryChipTextActive}>{cat.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.categoryChip, { borderColor: cat.color + '40' }]}>
                        <Text style={[styles.categoryChipText, { color: cat.color }]}>
                          {cat.label}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {priorities.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriority(priority === p.value ? undefined : p.value)}
                    activeOpacity={0.7}
                  >
                    {priority === p.value ? (
                      <View style={[styles.priorityChipActive, { borderColor: p.color }]}>
                        <Text style={[styles.priorityChipTextActive, { color: p.color }]}>
                          {p.label}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.priorityChip}>
                        <Text style={styles.priorityChipText}>{p.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  // TODO: Implement date picker
                  const now = new Date();
                  setDueDate(now.toISOString());
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.dateButtonText}>
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'Set due date'}
                </Text>
                {dueDate && (
                  <TouchableOpacity
                    onPress={() => setDueDate(undefined)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Location</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => setShowLocationPicker(true)}
              >
                <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.locationButtonText}>
                  {location?.placeName || location?.address || 'Add location'}
                </Text>
                {location && (
                  <TouchableOpacity
                    onPress={() => setLocation(undefined)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Recurrence */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Repeat</Text>
              <TouchableOpacity
                style={styles.recurrenceButton}
                onPress={() => setShowRecurrencePicker(true)}
              >
                <Ionicons name="repeat-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.recurrenceButtonText}>
                  {recurrence ? `${recurrence.type} (every ${recurrence.interval || 1})` : 'No repeat'}
                </Text>
                {recurrence && (
                  <TouchableOpacity
                    onPress={() => setRecurrence(undefined)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Subtasks */}
            <View style={styles.section}>
              <View style={styles.subtaskHeader}>
                <Text style={styles.sectionLabel}>Checklist</Text>
                <TouchableOpacity onPress={handleAddSubtask} style={styles.addSubtaskButton}>
                  <Ionicons name="add-circle-outline" size={20} color={colors.category.work} />
                  <Text style={styles.addSubtaskText}>Add</Text>
                </TouchableOpacity>
              </View>
              <SubtaskList
                subtasks={subtasks}
                onUpdate={handleUpdateSubtask}
                onRemove={handleRemoveSubtask}
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Private Notes */}
            <View style={styles.section}>
              <View style={styles.privateNotesHeader}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.privateNotesLabel}>Private Notes (hidden from main view)</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                placeholder="Private notes only visible when editing..."
                placeholderTextColor={colors.textSecondary}
                value={privateNotes}
                onChangeText={setPrivateNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Estimated Time */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Estimated Time (minutes)</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="e.g., 30"
                placeholderTextColor={colors.textSecondary}
                value={estimatedMinutes?.toString() || ''}
                onChangeText={(text) => setEstimatedMinutes(text ? parseInt(text, 10) : undefined)}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          {/* Location Picker Modal */}
          <LocationPicker
            visible={showLocationPicker}
            location={location}
            onClose={() => setShowLocationPicker(false)}
            onSave={(loc) => {
              setLocation(loc);
              setShowLocationPicker(false);
            }}
          />

          {/* Recurrence Picker Modal */}
          <RecurrencePicker
            visible={showRecurrencePicker}
            recurrence={recurrence}
            onClose={() => setShowRecurrencePicker(false)}
            onSave={(rec) => {
              setRecurrence(rec);
              setShowRecurrencePicker(false);
            }}
          />
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.category.work,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  categoryChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
  },
  categoryChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
  },
  categoryChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  priorityChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  priorityChipActive: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  priorityChipText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  priorityChipTextActive: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationButtonText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  recurrenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recurrenceButtonText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  addSubtaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  addSubtaskText: {
    fontSize: typography.fontSize.caption,
    color: colors.category.work,
    fontWeight: typography.fontWeight.medium,
  },
  notesInput: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  privateNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  privateNotesLabel: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timeInput: {
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
