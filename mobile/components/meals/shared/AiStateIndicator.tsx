import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../constants/designTokens';

export type AiState = 'idle' | 'drafting' | 'waiting' | 'validating' | 'ready' | 'failed' | 'cancelled' | 'stale';

interface AiStateIndicatorProps {
  state: AiState;
  message?: string;
}

const STATE_CONFIG: Record<AiState, { icon?: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  idle: { color: colors.textSecondary, label: '' },
  drafting: { color: colors.category.work, label: 'Δημιουργία πρότασης…' },
  waiting: { color: colors.category.work, label: 'Αναμονή εισαγωγής…' },
  validating: { color: colors.category.stability, label: 'Επαλήθευση…' },
  ready: { icon: 'checkmark-circle', color: colors.category.leverage, label: 'Έτοιμο' },
  failed: { icon: 'alert-circle', color: colors.error, label: 'Αποτυχία' },
  cancelled: { icon: 'close-circle', color: colors.textSecondary, label: 'Ακυρώθηκε' },
  stale: { icon: 'time', color: colors.warning, label: 'Παλιά δεδομένα' },
};

export function AiStateIndicator({ state, message }: AiStateIndicatorProps) {
  if (state === 'idle') return null;

  const config = STATE_CONFIG[state];
  const isSpinner = state === 'drafting' || state === 'validating';

  return (
    <View style={[styles.container, { borderColor: config.color + '40' }]}>
      {isSpinner ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : config.icon ? (
        <Ionicons name={config.icon} size={16} color={config.color} />
      ) : null}
      <Text style={[styles.text, { color: config.color }]}>
        {message ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
});
