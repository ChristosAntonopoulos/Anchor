import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';
import { BetterTodayItem } from './BetterTodayItem';
import type { BetterItem } from '../../types';

interface BetterTodayListProps {
  items: BetterItem[];
  onToggleItem: (id: string) => void;
  onAcceptItem: (id: string) => void;
  onEditItem: (id: string, title: string) => void;
  onRejectItem: (id: string) => void;
}

export function BetterTodayList({ items, onToggleItem, onAcceptItem, onEditItem, onRejectItem }: BetterTodayListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
        <Text style={styles.emptyText}>Choose one thing to move forward today.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1E2530', '#252B38']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.frame}
      >
        <Text style={styles.sectionTitle}>What Makes Me Better Today</Text>
        <View style={styles.itemsContainer}>
          {items.map((item) => (
        <BetterTodayItem
          key={item.id}
          item={item}
          onToggle={() => onToggleItem(item.id)}
          onAccept={() => onAcceptItem(item.id)}
          onEdit={(title) => onEditItem(item.id, title)}
          onReject={() => onRejectItem(item.id)}
        />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.l,
    marginBottom: spacing.l,
  },
  frame: {
    borderRadius: borderRadius.large,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.m,
  },
  itemsContainer: {
    gap: spacing.s,
  },
  emptyContainer: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.m,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: typography.fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
