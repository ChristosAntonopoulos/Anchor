import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/designTokens';
import { MenuModal } from '../../components/navigation/MenuModal';

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
          <LinearGradient
            colors={focused ? [colors.category.stability, colors.category.stability + 'CC'] : ['#1E2530', '#252B38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuButtonGradient}
          >
            <Ionicons
              name="grid-outline"
              size={28}
              color={focused ? colors.background : colors.textPrimary}
            />
          </LinearGradient>
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
          tabBarActiveTintColor: colors.category.work,
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarLabel: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle-outline" size={size} color={color} />
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discipline"
          options={{
            title: 'Discipline',
            tabBarLabel: 'Discipline',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="star-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
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
  menuButtonFocused: {
    ...shadows.glow.stability,
  },
  menuButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
});
