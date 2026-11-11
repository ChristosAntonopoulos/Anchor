import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusChip } from '../../components/distraction-guard/StatusChip';
import { PresetChips } from '../../components/distraction-guard/PresetChips';
import { BypassSheet } from '../../components/distraction-guard/BypassSheet';
import { IntentionalUseSheet } from '../../components/distraction-guard/IntentionalUseSheet';
import { useDistractionGuardStore } from '../../store/useDistractionGuardStore';
import { formatMmSs, pickReplacementAction } from '../../features/distraction-guard/policyEngine';
import {
  getReplacementAction,
  getStuckHelp,
  type ReplacementAction,
} from '../../features/distraction-guard/aiCoach';
import { guardTokens } from '../../features/distraction-guard/guardTokens';
import { useRouter } from 'expo-router';

export default function DistractionGuardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bypass?: string; intentional?: string }>();
  const {
    available,
    status,
    settings,
    targets,
    error,
    refresh,
    updateSettings,
    completeSetup,
    requestUsageAccess,
    bypass,
    endRestriction,
    disableAll,
    clearHistoryOnly,
  } = useDistractionGuardStore();

  const [bypassOpen, setBypassOpen] = useState(false);
  const [intentionalOpen, setIntentionalOpen] = useState(false);
  const initial = pickReplacementAction();
  const [replacement, setReplacement] = useState<ReplacementAction>({
    title: initial.title,
    instruction: initial.instruction,
    estimatedSeconds: initial.estimatedSeconds,
    linkedTaskId: null,
    easierAlternative: initial.easierAlternative,
    category: initial.category,
    source: 'predefined',
  });
  const [stuck, setStuck] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const id = setInterval(refresh, 15000);
      return () => clearInterval(id);
    }, [refresh])
  );

  useEffect(() => {
    if (params.bypass === '1') setBypassOpen(true);
    if (params.intentional === '1') setIntentionalOpen(true);
  }, [params.bypass, params.intentional]);

  useEffect(() => {
    getReplacementAction().then(setReplacement);
  }, [status?.cycle?.cycleStatus]);

  const explanation = useMemo(() => {
    const a = Math.round((settings?.allowanceSeconds ?? 300) / 60);
    const c = Math.round((settings?.cooldownSeconds ?? 900) / 60);
    return `Μετά από ${a} συνολικά λεπτά στα επιλεγμένα apps, ενεργοποιείται διάλειμμα ${c} λεπτών.`;
  }, [settings?.allowanceSeconds, settings?.cooldownSeconds]);

  const staleMinutes = useMemo(() => {
    const last = status?.capabilities.lastSuccessfulObservationAt;
    if (!last) return null;
    return Math.max(0, Math.round((Date.now() - last) / 60000));
  }, [status?.capabilities.lastSuccessfulObservationAt]);

  if (!available) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Distraction Guard</Text>
          <Text style={styles.subtitle}>Rebuild the Android app to include native monitoring.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  const enabled = settings?.enabled ?? false;
  const cycleStatus = status?.cycle?.cycleStatus;
  const inCooldown = cycleStatus === 'COOLDOWN_ACTIVE';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Distraction Guard</Text>
          <Text style={styles.subtitle}>Λιγότερο αυτόματο scrolling. Περισσότερος έλεγχος.</Text>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Enabled</Text>
              <Switch
                value={enabled}
                onValueChange={(v) => {
                  if (!v) {
                    disableAll();
                  } else {
                    updateSettings({ enabled: true, setupComplete: true });
                  }
                }}
                trackColor={{ false: guardTokens.divider, true: guardTokens.focus }}
                thumbColor={guardTokens.textPrimary}
              />
            </View>
            <StatusChip
              protectionState={status?.protectionState ?? 'DISABLED'}
              cycleStatus={cycleStatus}
            />
            {!settings?.setupComplete ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={completeSetup}>
                <Text style={styles.primaryBtnText}>Ολοκλήρωση setup</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Section A — Current protection */}
          <Text style={styles.section}>Current protection</Text>
          <View style={styles.card}>
            {inCooldown ? (
              <>
                <Text style={styles.bigTime}>{formatMmSs(status?.remainingCooldownMs ?? 0)}</Text>
                <Text style={styles.muted}>Διάλειμμα σε εξέλιξη</Text>
              </>
            ) : (
              <>
                <Text style={styles.bigTime}>{formatMmSs(status?.remainingAllowanceMs ?? 0)}</Text>
                <Text style={styles.muted}>
                  Από τα {Math.round((settings?.allowanceSeconds ?? 300) / 60)} λεπτά χρήσης
                </Text>
              </>
            )}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      inCooldown
                        ? Math.min(
                            100,
                            100 -
                              ((status?.remainingCooldownMs ?? 0) /
                                ((settings?.cooldownSeconds ?? 900) * 1000)) *
                                100
                          )
                        : Math.min(
                            100,
                            100 -
                              ((status?.remainingAllowanceMs ?? 0) /
                                ((settings?.allowanceSeconds ?? 300) * 1000)) *
                                100
                          )
                    }%`,
                    backgroundColor: inCooldown ? guardTokens.warning : guardTokens.focus,
                  },
                ]}
              />
            </View>
            {staleMinutes != null && staleMinutes > 2 ? (
              <Text style={styles.warnText}>Last updated {staleMinutes} minutes ago.</Text>
            ) : (
              <Text style={styles.muted}>
                Monitoring:{' '}
                {status?.capabilities.usageAccessGranted ? 'Usage Access granted' : 'Needs Usage Access'}
              </Text>
            )}
            {!status?.capabilities.canRestrictNativeApps ? (
              <Text style={styles.warnText}>
                Hard app blocking unavailable. Guard observes, warns, and presents cooldown —
                it does not suspend packages.
              </Text>
            ) : null}
            <Text style={styles.replacement}>{replacement.instruction}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setBypassOpen(true)}>
                <Text style={styles.secondaryBtnText}>Χρειάζομαι πρόσβαση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={async () => setStuck((await getStuckHelp()).action)}
              >
                <Text style={styles.secondaryBtnText}>I'm stuck</Text>
              </TouchableOpacity>
            </View>
            {stuck ? <Text style={styles.stuck}>{stuck}</Text> : null}
          </View>

          {/* Section B — My rules */}
          <Text style={styles.section}>My rules</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Χρόνος χρήσης</Text>
            <PresetChips
              options={[
                { label: '2 λεπτά', value: 120 },
                { label: '5 λεπτά', value: 300 },
                { label: '10 λεπτά', value: 600 },
                { label: '15 λεπτά', value: 900 },
              ]}
              value={settings?.allowanceSeconds ?? 300}
              onChange={(v) => updateSettings({ allowanceSeconds: v })}
            />
            <Text style={[styles.cardTitle, { marginTop: 16 }]}>Χρόνος διαλείμματος</Text>
            <PresetChips
              options={[
                { label: '5 λεπτά', value: 300 },
                { label: '10 λεπτά', value: 600 },
                { label: '15 λεπτά', value: 900 },
                { label: '30 λεπτά', value: 1800 },
              ]}
              value={settings?.cooldownSeconds ?? 900}
              onChange={(v) => updateSettings({ cooldownSeconds: v })}
            />
            <Text style={styles.explain}>{explanation}</Text>
          </View>

          {/* Section C — Apps */}
          <Text style={styles.section}>Εφαρμογές που με αποσπούν</Text>
          <View style={styles.card}>
            {targets.map((t) => {
              const selected = settings?.targetPackages?.includes(t.packageName) ?? false;
              return (
                <View key={t.packageName} style={styles.targetRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetName}>{t.label}</Text>
                    <Text style={styles.muted}>
                      {t.packageName}
                      {!t.installed ? ' · not installed' : ''}
                      {' · '}
                      {status?.capabilities.canObserveNativeApps
                        ? 'Monitoring capable'
                        : 'Needs Usage Access'}
                    </Text>
                  </View>
                  <Switch
                    value={selected}
                    onValueChange={(on) => {
                      const current = settings?.targetPackages ?? [];
                      const next = on
                        ? [...new Set([...current, t.packageName])]
                        : current.filter((p) => p !== t.packageName);
                      updateSettings({ targetPackages: next });
                    }}
                    trackColor={{ false: guardTokens.divider, true: guardTokens.focus }}
                  />
                </View>
              );
            })}
          </View>

          {/* Section D — Websites */}
          <Text style={styles.section}>Ιστοσελίδες</Text>
          <View style={styles.card}>
            {(settings?.targetHosts ?? []).map((host) => (
              <View key={host} style={styles.targetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.targetName}>{host}</Text>
                  <Text style={styles.muted}>
                    {status?.capabilities.browserDetectionStatus ?? 'Site cannot be verified.'}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.cardTitle}>Treat whole browser as distracting</Text>
                <Text style={styles.muted}>Default OFF. May count useful browsing.</Text>
              </View>
              <Switch
                value={settings?.treatWholeBrowserAsDistracting ?? false}
                onValueChange={(v) => updateSettings({ treatWholeBrowserAsDistracting: v })}
                trackColor={{ false: guardTokens.divider, true: guardTokens.warning }}
              />
            </View>
          </View>

          {/* Section E — Schedule */}
          <Text style={styles.section}>Πότε λειτουργεί</Text>
          <View style={styles.card}>
            <Text style={styles.muted}>
              Default κάθε μέρα{' '}
              {formatHour(settings?.scheduleStartMinutes ?? 420)}–
              {formatHour(settings?.scheduleEndMinutes ?? 1380)}
            </Text>
            <View style={styles.row}>
              {[
                { label: 'All day', start: 0, end: 0 },
                { label: 'Work hours', start: 9 * 60, end: 18 * 60 },
                { label: 'Evenings', start: 18 * 60, end: 23 * 60 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.chip}
                  onPress={() =>
                    updateSettings({
                      scheduleStartMinutes: p.start,
                      scheduleEndMinutes: p.end === 0 ? 24 * 60 : p.end,
                      activeDays: [0, 1, 2, 3, 4, 5, 6],
                    })
                  }
                >
                  <Text style={styles.chipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                updateSettings({ pausedUntilMs: Date.now() + 60 * 60 * 1000 })
              }
            >
              <Text style={styles.secondaryBtnText}>Pause 1 hour</Text>
            </TouchableOpacity>
          </View>

          {/* Section F — Opening */}
          <Text style={styles.section}>Πριν ανοίξω ένα app</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Opening pause</Text>
              <Switch
                value={settings?.openingFrictionEnabled ?? true}
                onValueChange={(v) => updateSettings({ openingFrictionEnabled: v })}
                trackColor={{ false: guardTokens.divider, true: guardTokens.focus }}
              />
            </View>
            <PresetChips
              options={[
                { label: 'Off', value: 0 },
                { label: '3s', value: 3 },
                { label: '5s', value: 5 },
                { label: '10s', value: 10 },
              ]}
              value={settings?.openingPauseSeconds ?? 5}
              onChange={(v) =>
                updateSettings({
                  openingPauseSeconds: v,
                  openingFrictionEnabled: v > 0,
                })
              }
            />
            <Text style={styles.muted}>
              Max {settings?.maxFrictionPerHour ?? 4}/hour · debounce{' '}
              {settings?.sessionDebounceSeconds ?? 30}s
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIntentionalOpen(true)}>
              <Text style={styles.secondaryBtnText}>Preview intentional use</Text>
            </TouchableOpacity>
          </View>

          {/* Section I — Permissions */}
          <Text style={styles.section}>Κατάσταση προστασίας</Text>
          <View style={styles.card}>
            <CapabilityRow
              label="Usage Access"
              ok={!!status?.capabilities.usageAccessGranted}
              actionLabel="Grant"
              onAction={requestUsageAccess}
            />
            <CapabilityRow
              label="Observe native apps"
              ok={!!status?.capabilities.canObserveNativeApps}
            />
            <CapabilityRow
              label="Immediate intervention (overlay)"
              ok={!!status?.capabilities.canPresentImmediateIntervention}
            />
            <CapabilityRow
              label="Restrict native apps"
              ok={!!status?.capabilities.canRestrictNativeApps}
            />
            <CapabilityRow
              label="Browser domain detection"
              ok={!!status?.capabilities.canIdentifyBrowserDomains}
            />
            {(status?.capabilities.knownLimitations ?? []).map((l) => (
              <Text key={l} style={styles.muted}>
                · {l}
              </Text>
            ))}
          </View>

          {/* Section J — Data */}
          <Text style={styles.section}>Data controls</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/more/distraction-guard-insights' as any)}
            >
              <Text style={styles.secondaryBtnText}>View insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                Alert.alert('Clear history?', 'Settings are kept. Only local usage history is cleared.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: clearHistoryOnly },
                ])
              }
            >
              <Text style={styles.secondaryBtnText}>Clear local history</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.dangerBtn]}
              onPress={() =>
                Alert.alert('Disable Distraction Guard?', 'Stops monitoring immediately.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disable', style: 'destructive', onPress: disableAll },
                ])
              }
            >
              <Text style={styles.secondaryBtnText}>Disable everything</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BypassSheet
        visible={bypassOpen}
        onClose={() => setBypassOpen(false)}
        onBypass={bypass}
        onEndRestriction={endRestriction}
      />
      <IntentionalUseSheet
        visible={intentionalOpen}
        onClose={() => setIntentionalOpen(false)}
        onSave={() => {
          // Declared intention is recorded conceptually; usage still counts by default.
        }}
      />
    </SafeAreaView>
  );
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function CapabilityRow({
  label,
  ok,
  actionLabel,
  onAction,
}: {
  label: string;
  ok: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.capRow}>
      <Text style={styles.targetName}>
        {ok ? '●' : '○'} {label}
      </Text>
      {!ok && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: guardTokens.focus }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: guardTokens.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  title: { color: guardTokens.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: guardTokens.textSecondary, marginTop: 6, marginBottom: 18, fontSize: 15 },
  section: {
    color: guardTokens.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: guardTokens.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  cardTitle: { color: guardTokens.textPrimary, fontWeight: '600', fontSize: 15 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bigTime: { color: guardTokens.focus, fontSize: 40, fontWeight: '700' },
  muted: { color: guardTokens.textSecondary, fontSize: 13, lineHeight: 18 },
  warnText: { color: guardTokens.warning, fontSize: 13, lineHeight: 18 },
  explain: { color: guardTokens.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: guardTokens.elevated,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 99 },
  replacement: { color: guardTokens.textPrimary, fontSize: 15, marginTop: 4 },
  stuck: { color: guardTokens.focus, fontSize: 16, fontWeight: '600' },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: guardTokens.focus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#0D1117', fontWeight: '700' },
  secondaryBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    backgroundColor: guardTokens.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: guardTokens.textPrimary, fontWeight: '600' },
  dangerBtn: { borderColor: guardTokens.warning },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: guardTokens.divider,
  },
  targetName: { color: guardTokens.textPrimary, fontSize: 15, fontWeight: '500' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: guardTokens.elevated,
    borderWidth: 1,
    borderColor: guardTokens.divider,
  },
  chipText: { color: guardTokens.textPrimary },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  error: { color: guardTokens.warning, marginTop: 12 },
});
