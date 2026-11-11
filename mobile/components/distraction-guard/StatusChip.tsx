import { View, Text, StyleSheet } from 'react-native';
import { guardTokens } from '../../features/distraction-guard/guardTokens';

const labels: Record<string, string> = {
  ACTIVE: 'Ενεργό',
  OUTSIDE_SCHEDULE: 'Εκτός προγράμματος',
  COOLDOWN_ACTIVE: 'Διάλειμμα',
  PAUSED: 'Προσωρινή πρόσβαση',
  DISABLED: 'Ανενεργό',
  DEGRADED: 'Χρειάζεται άδεια',
  LIMITED: 'Περιορισμένη παρακολούθηση',
};

export function StatusChip({
  protectionState,
  cycleStatus,
}: {
  protectionState: string;
  cycleStatus?: string;
}) {
  const key =
    cycleStatus === 'PAUSED'
      ? 'PAUSED'
      : cycleStatus === 'COOLDOWN_ACTIVE'
        ? 'COOLDOWN_ACTIVE'
        : protectionState === 'DEGRADED'
          ? 'DEGRADED'
          : protectionState;
  const label = labels[key] ?? key;
  const cool = key === 'COOLDOWN_ACTIVE' || key === 'DEGRADED' || key === 'PAUSED';
  return (
    <View style={[styles.chip, cool ? styles.warn : styles.ok]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  ok: {
    backgroundColor: '#8BB8A822',
    borderColor: guardTokens.focus,
  },
  warn: {
    backgroundColor: '#D9A76B22',
    borderColor: guardTokens.warning,
  },
  text: {
    color: guardTokens.textPrimary,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
