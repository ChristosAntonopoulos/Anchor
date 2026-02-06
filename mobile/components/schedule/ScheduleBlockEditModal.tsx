import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import type { ScheduleBlock } from '../../types';

interface ScheduleBlockEditModalProps {
  visible: boolean;
  block: ScheduleBlock;
  onClose: () => void;
  onSave: (updates: { title?: string; startTime?: string; endTime?: string }) => void;
}

export function ScheduleBlockEditModal({
  visible,
  block,
  onClose,
  onSave,
}: ScheduleBlockEditModalProps) {
  const [title, setTitle] = useState(block.title);
  const [startTime, setStartTime] = useState(block.startTime);
  const [endTime, setEndTime] = useState(block.endTime);

  useEffect(() => {
    if (visible) {
      setTitle(block.title);
      setStartTime(block.startTime);
      setEndTime(block.endTime);
    }
  }, [visible, block]);

  const handleSave = () => {
    const updates: { title?: string; startTime?: string; endTime?: string } = {};
    if (title.trim() !== block.title) updates.title = title.trim();
    if (startTime !== block.startTime) updates.startTime = startTime;
    if (endTime !== block.endTime) updates.endTime = endTime;
    
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#1E2530', '#252B38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalContent}
          >
            <Text style={styles.title}>Edit Schedule Block</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Block title..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.timeRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.category.work, colors.category.work + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    padding: spacing.l,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    ...shadows.large,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.l,
  },
  inputGroup: {
    marginBottom: spacing.m,
  },
  label: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.m,
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: spacing.m,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
