import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { useCookingStore } from '../../store/useCookingStore';

function formatRemain(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ActiveTimersBar() {
  const router = useRouter();
  const timers = useCookingStore((s) => s.timers);
  const tick = useCookingStore((s) => s.tick);
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      tick();
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const running = timers.filter((t) => t.status === 'running');
  const ringing = timers.filter((t) => t.status === 'done' && t.notified);
  if (running.length === 0 && ringing.length === 0) return null;

  const primary = running[0] ?? ringing[0];

  return (
    <TouchableOpacity
      style={styles.bar}
      onPress={() => router.push(`/more/meals/cook/${primary.slotId}` as any)}
      activeOpacity={0.85}
    >
      <Ionicons
        name={running.length ? 'timer-outline' : 'notifications'}
        size={18}
        color={running.length ? colors.category.health : colors.warning}
      />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {running.length
            ? `${running.length} cooking timer${running.length === 1 ? '' : 's'}`
            : 'Step ready'}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {running
            .map((t) => `${t.recipeName}: ${formatRemain(t.endsAt - Date.now())}`)
            .concat(ringing.slice(0, 1).map((t) => t.action))
            .join(' · ')}
        </Text>
      </View>
      {running[0] && (
        <Text style={styles.clock}>{formatRemain(running[0].endsAt - Date.now())}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.category.health + '55',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  copy: { flex: 1 },
  title: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clock: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: colors.category.health,
    fontVariant: ['tabular-nums'],
  },
});
