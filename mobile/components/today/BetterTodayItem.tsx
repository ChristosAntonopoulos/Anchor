import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, getCategoryColor, getCategoryGlow, getCategoryShadow, borderRadius, shadows } from '../../constants/designTokens';
import type { BetterItem } from '../../types';
import { BetterItemActions } from './BetterItemActions';
import { BetterItemEditModal } from './BetterItemEditModal';

interface BetterTodayItemProps {
  item: BetterItem;
  onToggle: () => void;
  onAccept: () => void;
  onEdit: (title: string) => void;
  onReject: () => void;
}

export function BetterTodayItem({ item, onToggle, onAccept, onEdit, onReject }: BetterTodayItemProps) {
  const [actionsVisible, setActionsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const categoryColor = getCategoryColor(item.category);
  const glowColor = getCategoryGlow(item.category);
  const shadowStyle = getCategoryShadow(item.category);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLongPress = () => {
    if (!item.completed) {
      setActionsVisible(true);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleEdit = () => {
    setEditVisible(true);
  };

  const handleSaveEdit = (title: string) => {
    onEdit(title);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          item.completed && styles.completed,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onToggle}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={item.completed ? ['#1E2530', '#252B38'] : ['#1E2530', '#252B38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <View style={[styles.glowDot, { backgroundColor: glowColor }]} />
            <Text style={[styles.title, item.completed && styles.completedText]}>
              {item.title}
            </Text>
            <View style={[styles.checkbox, item.completed && styles.checkboxChecked, item.completed && { backgroundColor: categoryColor }]}>
              {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <BetterItemActions
        visible={actionsVisible}
        onClose={() => setActionsVisible(false)}
        onAccept={onAccept}
        onEdit={handleEdit}
        onReject={onReject}
        itemTitle={item.title}
      />

      <BetterItemEditModal
        visible={editVisible}
        initialTitle={item.title}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveEdit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  completed: {
    opacity: 0.6,
  },
  gradient: {
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.s,
    zIndex: 2,
  },
  glowDot: {
    position: 'absolute',
    left: spacing.m + 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.6,
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.regular,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.s,
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
