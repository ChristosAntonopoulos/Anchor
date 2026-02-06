import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface BetterItemActionsProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
  itemTitle: string;
}

export function BetterItemActions({
  visible,
  onClose,
  onAccept,
  onEdit,
  onReject,
  itemTitle,
}: BetterItemActionsProps) {
  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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
            <Text style={styles.title} numberOfLines={2}>{itemTitle}</Text>
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAccept}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.category.leverage, colors.category.leverage + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={24} color={colors.background} />
                  <Text style={styles.actionButtonText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.category.work, colors.category.work + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="create-outline" size={24} color={colors.background} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReject}
                activeOpacity={0.7}
              >
                <View style={styles.rejectButton}>
                  <Ionicons name="close-circle-outline" size={24} color={colors.error} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: borderRadius.large,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.large,
  },
  title: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  actionButton: {
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    gap: spacing.s,
  },
  actionButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.m,
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  rejectButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },
  cancelButton: {
    padding: spacing.m,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
  },
});
