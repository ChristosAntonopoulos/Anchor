import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDistractionGuardStore } from '../../store/useDistractionGuardStore';
import { getWeeklyReflection } from '../../features/distraction-guard/aiCoach';
import { guardTokens } from '../../features/distraction-guard/guardTokens';
import { useState } from 'react';

export default function DistractionGuardInsightsScreen() {
  const { insights, loadInsights, updateSettings } = useDistractionGuardStore();
  const [reflection, setReflection] = useState<Awaited<ReturnType<typeof getWeeklyReflection>> | null>(
    null
  );

  useFocusEffect(
    useCallback(() => {
      loadInsights(7);
    }, [loadInsights])
  );

  const totalMinutes =
    insights?.distractingMinutesByDay.reduce((sum, d) => sum + d.minutes, 0) ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Τελευταίες 7 μέρες · μόνο verified χρήση επιλεγμένων apps</Text>

        <View style={styles.grid}>
          <Stat
            label="Λεπτά απόσπασης"
            value={`${Math.round(totalMinutes)}`}
          />
          <Stat
            label="Unlock→απόσπαση"
            value={
              insights?.unlockToDistractionRate == null
                ? '—'
                : `${Math.round(insights.unlockToDistractionRate * 100)}%`
            }
          />
          <Stat
            label="Επιστροφή από παύση"
            value={
              insights?.openingPromptDismissRate == null
                ? '—'
                : `${Math.round(insights.openingPromptDismissRate * 100)}%`
            }
          />
          <Stat
            label="Κάλυψη"
            value={
              insights?.monitoringCoverageLabel?.startsWith('Επαρκής') ? 'Επαρκής' : insights ? 'Περιορισμένη' : '—'
            }
          />
        </View>

        <Text style={styles.section}>Ημερήσια χρήση επιλεγμένων apps</Text>
        <View style={styles.card}>
          {(insights?.distractingMinutesByDay ?? []).length === 0 ? (
            <Text style={styles.muted}>Δεν υπάρχουν verified διαστήματα στο εύρος.</Text>
          ) : (
            insights?.distractingMinutesByDay.map((d) => (
              <View key={d.date} style={{ gap: 4 }}>
                <View style={styles.barRow}>
                  <Text style={styles.day}>{d.date.slice(5)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(
                            100,
                            (d.minutes / Math.max(...(insights?.distractingMinutesByDay.map((x) => x.minutes) ?? [1]), 1)) *
                              100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.mins}>{d.minutes}m</Text>
                </View>
                <Text style={styles.muted}>
                  {Object.entries(d.byPackage)
                    .map(([k, v]) => `${k} ${v}m`)
                    .join(' · ') || '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.section}>Patterns</Text>
        <View style={styles.card}>
          {(insights?.observations ?? []).length === 0 ? (
            <Text style={styles.muted}>Not enough consistent data for a pattern yet.</Text>
          ) : (
            insights?.observations.map((o) => (
              <Text key={o.id} style={styles.obs}>
                {o.text}
              </Text>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.primary}
          onPress={async () => {
            const result = await getWeeklyReflection({
              verifiedDistractingMinutes: totalMinutes,
              unlockToDistractionRate: insights?.unlockToDistractionRate ?? null,
              monitoringHealthy: insights?.monitoringCoverageLabel.includes('Adequate') ?? false,
            });
            setReflection(result);
          }}
        >
          <Text style={styles.primaryText}>Weekly reflection</Text>
        </TouchableOpacity>

        {reflection ? (
          <View style={styles.card}>
            {reflection.observations.map((o) => (
              <Text key={o} style={styles.obs}>
                {o}
              </Text>
            ))}
            {reflection.dataQualityWarning ? (
              <Text style={styles.warn}>{reflection.dataQualityWarning}</Text>
            ) : null}
            {reflection.proposedChange ? (
              <>
                <Text style={styles.obs}>{reflection.proposedChange}</Text>
                <Text style={styles.muted}>{reflection.supportingReason}</Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.secondary}
                    onPress={() =>
                      updateSettings({
                        openingFrictionEnabled: true,
                        openingPauseSeconds: 5,
                      })
                    }
                  >
                    <Text style={styles.secondaryText}>Apply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondary} onPress={() => setReflection(null)}>
                    <Text style={styles.secondaryText}>Not now</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: guardTokens.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: guardTokens.textPrimary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: guardTokens.textSecondary, marginBottom: 16, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  stat: {
    width: '47%',
    backgroundColor: guardTokens.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    padding: 12,
  },
  statValue: { color: guardTokens.focus, fontSize: 22, fontWeight: '700' },
  statLabel: { color: guardTokens.textSecondary, fontSize: 12, marginTop: 4 },
  section: {
    color: guardTokens.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: guardTokens.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    padding: 14,
    gap: 8,
    marginBottom: 8,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  day: { width: 48, color: guardTokens.textSecondary, fontSize: 12 },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: guardTokens.elevated,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: guardTokens.focus },
  mins: { width: 40, color: guardTokens.textPrimary, textAlign: 'right', fontSize: 12 },
  obs: { color: guardTokens.textPrimary, fontSize: 15, lineHeight: 22 },
  muted: { color: guardTokens.textSecondary, fontSize: 13 },
  warn: { color: guardTokens.warning, fontSize: 13 },
  primary: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: guardTokens.focus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#0D1117', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  secondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: guardTokens.textPrimary, fontWeight: '600' },
});
