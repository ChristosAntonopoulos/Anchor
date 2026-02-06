import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, gradients, borderRadius, shadows } from '../../constants/designTokens';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const menuItems: MenuItem[] = [
  { title: 'Money', icon: 'cash-outline', route: '/more/money', color: colors.category.leverage },
  { title: 'Deadlines', icon: 'calendar-outline', route: '/more/deadlines', color: colors.category.work },
  { title: 'Weekly Review', icon: 'document-text-outline', route: '/more/weekly-review', color: colors.category.stability },
  { title: 'Settings', icon: 'settings-outline', route: '/more/settings', color: colors.textSecondary },
];

export function MenuModal({ visible, onClose }: MenuModalProps) {
  const router = useRouter();

  const handlePress = (route: string) => {
    onClose();
    router.push(route as any);
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
            colors={gradients.background.colors}
            start={gradients.background.start}
            end={gradients.background.end}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Menu</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.route}
                  style={styles.menuItem}
                  onPress={() => handlePress(item.route)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#1E2530', '#252B38']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuItemGradient}
                  >
                    <View style={styles.menuItemContent}>
                      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon} size={24} color={item.color} />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  menuList: {
    padding: spacing.m,
  },
  menuItem: {
    marginBottom: spacing.m,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  menuItemGradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  menuItemText: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
