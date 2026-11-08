import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { AppIcon } from '../../components/icons/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants/designTokens';
import { YesterdayAssessmentModal } from '../../components/day/YesterdayAssessmentModal';
import { useDayBootstrap } from '../../hooks/useDayBootstrap';
import { useTodayStore } from '../../store/useTodayStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { data, fetchToday } = useTodayStore();
  const { bootstrap, showAssessment, dismissAssessment } = useDayBootstrap(data?.dayBootstrap);

  useEffect(() => {
    void fetchToday();
  }, [fetchToday]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            height: 52 + insets.top,
            paddingTop: insets.top,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: typography.fontWeight.semibold,
            fontSize: 18,
            color: colors.textPrimary,
          },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 10,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 56 + Math.max(insets.bottom, 16) : 62,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          tabBarItemStyle: {
            paddingTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            headerShown: false,
            tabBarLabel: 'Today',
            tabBarIcon: ({ size, color }) => <AppIcon name="dashboard" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarLabel: 'Tasks',
            tabBarIcon: ({ size, color }) => <AppIcon name="tasks" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarLabel: 'Schedule',
            tabBarIcon: ({ size, color }) => <AppIcon name="calendar" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cbt"
          options={{
            title: 'Check-in',
            tabBarLabel: 'Check-in',
            tabBarIcon: ({ size, color }) => <AppIcon name="mood" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'More',
            tabBarLabel: 'More',
            tabBarIcon: ({ size, color }) => (
              <AppIcon name="ellipsis-horizontal" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="unlocks"
          options={{
            title: 'Unlocks',
            href: null,
          }}
        />
        <Tabs.Screen
          name="discipline"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <YesterdayAssessmentModal
        visible={showAssessment}
        bootstrap={bootstrap}
        onDismiss={dismissAssessment}
      />
    </>
  );
}
