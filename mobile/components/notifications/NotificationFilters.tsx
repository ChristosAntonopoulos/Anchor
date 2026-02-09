import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/designTokens';

interface NotificationFiltersProps {
  filter: string;
  search: string;
  groupBy: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
  onGroupByChange: (groupBy: string) => void;
}

export function NotificationFilters({
  filter,
  search,
  groupBy,
  onFilterChange,
  onSearchChange,
  onGroupByChange,
}: NotificationFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={['#1E2530', '#252B38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.searchBox}
        >
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={onSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>

      <View style={styles.filtersRow}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <View style={styles.filterButtons}>
            {['all', 'task-relevant', 'unread', 'dismissed'].map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => onFilterChange(f)}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              >
                <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Group:</Text>
          <View style={styles.filterButtons}>
            {['none', 'app', 'date'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => onGroupByChange(g)}
                style={[styles.filterButton, groupBy === g && styles.filterButtonActive]}
              >
                <Text style={[styles.filterButtonText, groupBy === g && styles.filterButtonTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    marginBottom: spacing.m,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
  },
  clearButton: {
    marginLeft: spacing.s,
  },
  filtersRow: {
    gap: spacing.m,
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
    backgroundColor: '#1E2530',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.category.work,
    borderColor: colors.category.work,
  },
  filterButtonText: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontWeight: typography.fontWeight.semibold,
  },
});
