import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { AppIcon } from '../../components/icons/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, shadows } from '../../constants/designTokens';
import { MenuModal } from '../../components/navigation/MenuModal';
import { YesterdayAssessmentModal } from '../../components/day/YesterdayAssessmentModal';
import { useDayBootstrap } from '../../hooks/useDayBootstrap';
import { useTodayStore } from '../../store/useTodayStore';

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { data, fetchToday } = useTodayStore();
  const { bootstrap, showAssessment, dismissAssessment } = useDayBootstrap(data?.dayBootstrap);

  useEffect(() => {
    void fetchToday();
  }, [fetchToday]);

  // Custom menu button component (larger, centered)
  const MenuTabButton = ({ onPress, accessibilityState }: any) => {
    const focused = accessibilityState?.selected;
    
    return (
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.menuButtonContainer}
        activeOpacity={0.7}
      >
        <View style={[styles.menuButton, focused && styles.menuButtonFocused]}>
          <View style={[styles.menuButtonGradient, focused && styles.menuButtonGradientFocused]}>
            <AppIcon
              name="growth"
              size={28}
              color={focused ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
            height: 60 + insets.top,
            paddingTop: insets.top,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: typography.fontWeight.bold,
            fontSize: 22,
            letterSpacing: 0.5,
            color: colors.textPrimary,
          },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: Platform.OS === 'ios' ? 30 : 16,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 98 : 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ size, focused }) => (
              <View style={focused ? styles.tabSelected : undefined}>
                <AppIcon name="dashboard" size={size} color={focused ? colors.primary : colors.textSecondary} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarLabel: 'Tasks',
            tabBarIcon: ({ size, focused }) => (
              <View style={focused ? styles.tabSelected : undefined}>
                <AppIcon name="tasks" size={size} color={focused ? colors.primary : colors.textSecondary} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Menu',
            tabBarLabel: '',
            tabBarButton: MenuTabButton,
            tabBarIcon: () => null,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarLabel: 'Schedule',
            tabBarIcon: ({ size, focused }) => (
              <View style={focused ? styles.tabSelected : undefined}>
                <AppIcon name="calendar" size={size} color={focused ? colors.primary : colors.textSecondary} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="cbt"
          options={{
            title: 'Check-in',
            tabBarLabel: 'Check-in',
            tabBarIcon: ({ size, focused }) => (
              <View style={focused ? styles.tabSelected : undefined}>
                <AppIcon name="mood" size={size} color={focused ? colors.primary : colors.textSecondary} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="unlocks"
          options={{
            title: 'Unlocks',
            href: null, // Hide from tab bar - accessible through menu
          }}
        />
        <Tabs.Screen
          name="discipline"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <YesterdayAssessmentModal
        visible={showAssessment}
        bootstrap={bootstrap}
        onDismiss={dismissAssessment}
      />
    </>
  );
}

const styles = StyleSheet.create({
  menuButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...shadows.medium,
  },
  menuButtonFocused: {},
  menuButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderControl,
    backgroundColor: colors.surfaceRaised,
  },
  menuButtonGradientFocused: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  tabSelected: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
