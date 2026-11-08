import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../../components/icons/AppIcon';
import { colors, spacing, typography, gradients, borderRadius } from '../../constants/designTokens';

const menuItems = [
  { title: 'Meals', icon: 'nutrition', route: '/more/meals' },
  { title: 'Discipline', icon: 'habits', route: '/(tabs)/discipline' },
  { title: 'Unlocks', icon: 'focus', route: '/(tabs)/unlocks' },
  { title: 'Notifications', icon: 'notification', route: '/more/notifications' },
  { title: 'Money', icon: 'goals', route: '/more/money' },
  { title: 'Deadlines', icon: 'calendar', route: '/more/deadlines' },
  { title: 'Weekly Review', icon: 'journal', route: '/more/weekly-review' },
  { title: 'Settings', icon: 'settings', route: '/more/settings' },
] as const;

export default function MoreScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={gradients.background.colors}
      start={gradients.background.start}
      end={gradients.background.end}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.icon}>
              <AppIcon name={item.icon} size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <AppIcon name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: spacing.l,
    paddingBottom: spacing.xxl,
    gap: spacing.s,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    marginRight: spacing.m,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
