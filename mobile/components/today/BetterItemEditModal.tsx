import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface BetterItemEditModalProps {
  visible: boolean;
  initialTitle: string;
  onClose: () => void;
  onSave: (title: string) => void;
}

export function BetterItemEditModal({
  visible,
  initialTitle,
  onClose,
  onSave,
}: BetterItemEditModalProps) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
    }
  }, [visible, initialTitle]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
      onClose();
    }
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
            <Text style={styles.title}>Edit Item</Text>
            
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter item title..."
              placeholderTextColor={colors.textSecondary}
              autoFocus
              multiline
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={!title.trim()}
              >
                <LinearGradient
                  colors={title.trim() ? [colors.category.work, colors.category.work + 'CC'] : ['#2A3441', '#2A3441']}
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
    marginBottom: spacing.m,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.l,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.m,
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
  saveButtonDisabled: {
    opacity: 0.5,
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
