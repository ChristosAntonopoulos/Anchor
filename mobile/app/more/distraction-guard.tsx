import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
    reconcileNow,
    updateSettings,
    completeSetup,
    requestUsageAccess,
    requestOverlay,
    requestNotifications,
    bypass,
    endRestriction,
    disableAll,
    clearHistoryOnly,
    resetSettingsOnly,
    saveIntention,
  } = useDistractionGuardStore();
  const [customAllowance, setCustomAllowance] = useState('');
  const [customCooldown, setCustomCooldown] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());

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
      reconcileNow();
      const id = setInterval(() => {
        reconcileNow();
      }, 20000);
      return () => clearInterval(id);
    }, [refresh, reconcileNow])
  );

  useEffect(() => {
    if (params.bypass === '1') setBypassOpen(true);
    if (params.intentional === '1') setIntentionalOpen(true);
  }, [params.bypass, params.intentional]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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
  const bypassActive = !!status?.bypassActive;
  const inCooldown = cycleStatus === 'COOLDOWN_ACTIVE' && !bypassActive;
  const elapsedSinceSnapshot = Math.max(0, nowTick - (status?.lastUpdatedAtMs ?? nowTick));
  const displayAllowanceMs = Math.max(0, (status?.remainingAllowanceMs ?? 0) - elapsedSinceSnapshot);
  const displayCooldownMs = Math.max(0, (status?.remainingCooldownMs ?? 0) - elapsedSinceSnapshot);
  const displayProvisionalMs =
    (status?.provisionalUsageMs ?? 0) > 0
      ? (status?.provisionalUsageMs ?? 0) + elapsedSinceSnapshot
      : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Distraction Guard</Text>
          <Text style={styles.subtitle}>Λιγότερο αυτόματο scrolling. Περισσότερος έλεγχος.</Text>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Ενεργό</Text>
              <Switch
                value={enabled}
                onValueChange={(v) => {
                  if (!v) {
                    disableAll();
                  } else {
                    updateSettings({ enabled: true, setupComplete: true });
                    requestNotifications();
                  }
                }}
                trackColor={{ false: guardTokens.divider, true: guardTokens.focus }}
                thumbColor={guardTokens.textPrimary}
              />
            </View>
            <StatusChip
              protectionState={status?.protectionState ?? 'DISABLED'}
              cycleStatus={bypassActive ? 'PAUSED' : cycleStatus}
            />
            {bypassActive ? (
              <Text style={styles.warnText}>
                Προσωρινή πρόσβαση ενεργή
                {cycleStatus === 'COOLDOWN_ACTIVE'
                  ? ` — το διάλειμμα συνεχίζει στο παρασκήνιο (${formatMmSs(displayCooldownMs)}).`
                  : '.'}
              </Text>
            ) : null}
            {!settings?.setupComplete ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={completeSetup}>
                <Text style={styles.primaryBtnText}>Ολοκλήρωση setup</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Section A — Current protection */}
          <Text style={styles.section}>Τρέχουσα προστασία</Text>
          <View style={styles.card}>
            {bypassActive && cycleStatus === 'COOLDOWN_ACTIVE' ? (
              <>
                <Text style={styles.bigTime}>{formatMmSs(displayCooldownMs)}</Text>
                <Text style={styles.muted}>Υπόλοιπο διαλείμματος (τρέχει στο παρασκήνιο)</Text>
              </>
            ) : inCooldown ? (
              <>
                <Text style={styles.bigTime}>{formatMmSs(displayCooldownMs)}</Text>
                <Text style={styles.muted}>Διάλειμμα σε εξέλιξη</Text>
              </>
            ) : (
              <>
                <Text style={styles.bigTime}>{formatMmSs(displayAllowanceMs)}</Text>
                <Text style={styles.muted}>
                  {bypassActive
                    ? 'Προσωρινή πρόσβαση — το όριο χρήσης παγώνει'
                    : `Από τα ${Math.round((settings?.allowanceSeconds ?? 300) / 60)} λεπτά χρήσης`}
                </Text>
                {!bypassActive && displayProvisionalMs > 0 ? (
                  <Text style={styles.warnText}>
                    Σε εξέλιξη τώρα (~{formatMmSs(displayProvisionalMs)}) — μετράει όταν κλείσει το session.
                  </Text>
                ) : null}
              </>
            )}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      inCooldown || (bypassActive && cycleStatus === 'COOLDOWN_ACTIVE')
                        ? Math.min(
                            100,
                            100 -
                              (displayCooldownMs /
                                Math.max(
                                  1,
                                  (status?.cycle?.cooldownSeconds ??
                                    settings?.cooldownSeconds ??
                                    900) * 1000
                                )) *
                                100
                          )
                        : Math.min(
                            100,
                            100 -
                              (displayAllowanceMs /
                                Math.max(1, status?.cycle?.allowanceMs ?? (settings?.allowanceSeconds ?? 300) * 1000)) *
                                100
                          )
                    }%`,
                    backgroundColor:
                      inCooldown || (bypassActive && cycleStatus === 'COOLDOWN_ACTIVE')
                        ? guardTokens.warning
                        : guardTokens.focus,
                  },
                ]}
              />
            </View>
            <Text style={styles.muted}>
              Apps: {(settings?.targetPackages ?? []).map(shortPkg).join(', ') || '—'}
            </Text>
            <Text style={styles.muted}>
              Πρόγραμμα: {formatHour(settings?.scheduleStartMinutes ?? 420)}–
              {formatHour(settings?.scheduleEndMinutes ?? 1380)} · Διάλειμμα{' '}
              {Math.round((settings?.cooldownSeconds ?? 900) / 60)} λεπτά
            </Text>
            {staleMinutes != null && staleMinutes > 2 ? (
              <Text style={styles.warnText}>Τελευταία ενημέρωση πριν από {staleMinutes} λεπτά.</Text>
            ) : (
              <Text style={styles.muted}>
                Παρακολούθηση:{' '}
                {status?.capabilities.usageAccessGranted
                  ? 'Usage Access OK (reconciled)'
                  : 'Χρειάζεται Usage Access'}
              </Text>
            )}
            {!status?.capabilities.canRestrictNativeApps ? (
              <Text style={styles.warnText}>
                Δεν γίνεται hard block εφαρμογών. Παρατηρεί, ειδοποιεί και δείχνει διάλειμμα.
              </Text>
            ) : null}
            {settings?.showNextAction !== false ? (
              <Text style={styles.replacement}>{replacement.instruction}</Text>
            ) : null}
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setBypassOpen(true)}>
                <Text style={styles.secondaryBtnText}>Χρειάζομαι πρόσβαση</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={async () => setStuck((await getStuckHelp()).action)}
              >
                <Text style={styles.secondaryBtnText}>Κόλλησα</Text>
              </TouchableOpacity>
            </View>
            {stuck ? <Text style={styles.stuck}>{stuck}</Text> : null}
          </View>

          {/* Section B — My rules */}
          <Text style={styles.section}>Οι κανόνες μου</Text>
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
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                keyboardType="number-pad"
                placeholder="Custom λεπτά"
                placeholderTextColor={guardTokens.textSecondary}
                value={customAllowance}
                onChangeText={setCustomAllowance}
              />
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  const mins = Number(customAllowance);
                  if (mins > 0 && mins <= 180) {
                    updateSettings({ allowanceSeconds: Math.round(mins * 60) });
                  }
                }}
              >
                <Text style={styles.secondaryBtnText}>ΟΚ</Text>
              </TouchableOpacity>
            </View>
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
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                keyboardType="number-pad"
                placeholder="Custom λεπτά"
                placeholderTextColor={guardTokens.textSecondary}
                value={customCooldown}
                onChangeText={setCustomCooldown}
              />
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  const mins = Number(customCooldown);
                  if (mins > 0 && mins <= 240) {
                    updateSettings({ cooldownSeconds: Math.round(mins * 60) });
                  }
                }}
              >
                <Text style={styles.secondaryBtnText}>ΟΚ</Text>
              </TouchableOpacity>
            </View>
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
              Κάθε μέρα {formatHour(settings?.scheduleStartMinutes ?? 420)}–
              {formatHour(settings?.scheduleEndMinutes ?? 1380)}
            </Text>
            <View style={styles.row}>
              {[
                { label: 'Όλη μέρα', start: 0, end: 24 * 60 },
                { label: 'Εργασία', start: 9 * 60, end: 18 * 60 },
                { label: 'Βράδυ', start: 18 * 60, end: 23 * 60 },
              ].map((p) => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.chip}
                  onPress={() =>
                    updateSettings({
                      scheduleStartMinutes: p.start,
                      scheduleEndMinutes: p.end,
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
              onPress={() => {
                const until = Date.now() + 60 * 60 * 1000;
                updateSettings({ pausedUntilMs: until });
              }}
            >
              <Text style={styles.secondaryBtnText}>Παύση 1 ώρα</Text>
            </TouchableOpacity>
            {(settings?.pausedUntilMs ?? 0) > Date.now() ? (
              <Text style={styles.warnText}>
                Σε παύση μέχρι {new Date(settings?.pausedUntilMs ?? 0).toLocaleTimeString()}
              </Text>
            ) : null}
          </View>

          {/* Section F — Opening */}
          <Text style={styles.section}>Πριν ανοίξω ένα app</Text>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Μικρή παύση</Text>
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
              Max {settings?.maxFrictionPerHour ?? 4}/ώρα · debounce{' '}
              {settings?.sessionDebounceSeconds ?? 30}s
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIntentionalOpen(true)}>
              <Text style={styles.secondaryBtnText}>Δήλωση πρόθεσης</Text>
            </TouchableOpacity>
          </View>

          {/* Section G — Cooldown behavior */}
          <Text style={styles.section}>Όταν φτάνω το όριο</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Δείξε μία επόμενη ενέργεια"
              value={settings?.showNextAction !== false}
              onChange={(v) => updateSettings({ showNextAction: v })}
            />
            <ToggleRow
              label="Ήσυχες ειδοποιήσεις"
              value={!!settings?.quietNotifications}
              onChange={(v) => updateSettings({ quietNotifications: v })}
            />
            <ToggleRow
              label="Η πρόθεση μετράει στο κοινό όριο"
              value={settings?.intentionalUsesSharedAllowance !== false}
              onChange={(v) => updateSettings({ intentionalUsesSharedAllowance: v })}
            />
          </View>

          {/* Section H — Memory */}
          <Text style={styles.section}>Τι θέλω να μάθει η εφαρμογή</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Θυμήσου χρήσιμες παρεμβάσεις"
              value={settings?.rememberInterventions !== false}
              onChange={(v) => updateSettings({ rememberInterventions: v })}
            />
            <ToggleRow
              label="Ανάλυση unlock→distraction"
              value={settings?.analyzeUnlockPatterns !== false}
              onChange={(v) => updateSettings({ analyzeUnlockPatterns: v })}
            />
            <ToggleRow
              label="Καταγραφή intentional sessions"
              value={settings?.trackIntentionalSessions !== false}
              onChange={(v) => updateSettings({ trackIntentionalSessions: v })}
            />
            <ToggleRow
              label="Πρόταση εβδομαδιαίας βελτίωσης"
              value={settings?.suggestWeeklyImprovement !== false}
              onChange={(v) => updateSettings({ suggestWeeklyImprovement: v })}
            />
            <Text style={styles.muted}>
              Τοπικά aggregates μόνο. Όχι ιστορικό browsing, όχι περιεχόμενο posts.
            </Text>
          </View>

          {/* Section I — Permissions */}
          <Text style={styles.section}>Κατάσταση προστασίας</Text>
          <View style={styles.card}>
            <CapabilityRow
              label="Usage Access"
              ok={!!status?.capabilities.usageAccessGranted}
              actionLabel="Άδειες"
              onAction={requestUsageAccess}
            />
            <CapabilityRow
              label="Ειδοποιήσεις"
              ok={!!status?.capabilities.notificationsAllowed}
              actionLabel="Ζήτα"
              onAction={requestNotifications}
            />
            <CapabilityRow
              label="Παρατήρηση native apps"
              ok={!!status?.capabilities.canObserveNativeApps}
            />
            <CapabilityRow
              label="Άμεση παρέμβαση (overlay)"
              ok={!!status?.capabilities.canPresentImmediateIntervention}
              actionLabel="Άδειες"
              onAction={requestOverlay}
            />
            <CapabilityRow
              label="Περιορισμός native apps"
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
          <Text style={styles.section}>Δεδομένα</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/more/distraction-guard-insights' as any)}
            >
              <Text style={styles.secondaryBtnText}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                Alert.alert(
                  'Καθαρισμός ιστορικού;',
                  'Οι ρυθμίσεις μένουν. Διαγράφεται μόνο το τοπικό ιστορικό χρήσης.',
                  [
                    { text: 'Άκυρο', style: 'cancel' },
                    { text: 'Καθαρισμός', style: 'destructive', onPress: clearHistoryOnly },
                  ]
                )
              }
            >
              <Text style={styles.secondaryBtnText}>Καθαρισμός ιστορικού</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() =>
                Alert.alert(
                  'Επαναφορά ρυθμίσεων;',
                  'Το ιστορικό δεν διαγράφεται. Μόνο οι ρυθμίσεις επιστρέφουν στις προεπιλογές.',
                  [
                    { text: 'Άκυρο', style: 'cancel' },
                    { text: 'Επαναφορά', onPress: resetSettingsOnly },
                  ]
                )
              }
            >
              <Text style={styles.secondaryBtnText}>Επαναφορά ρυθμίσεων</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.dangerBtn]}
              onPress={() =>
                Alert.alert('Απενεργοποίηση;', 'Σταματά αμέσως η παρακολούθηση.', [
                  { text: 'Άκυρο', style: 'cancel' },
                  { text: 'Απενεργοποίηση', style: 'destructive', onPress: disableAll },
                ])
              }
            >
              <Text style={styles.secondaryBtnText}>Απενεργοποίηση όλων</Text>
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
        onSave={(payload) => saveIntention(payload)}
      />
    </SafeAreaView>
  );
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function shortPkg(pkg: string): string {
  if (pkg.includes('instagram')) return 'Instagram';
  if (pkg.includes('youtube')) return 'YouTube';
  if (pkg.includes('chrome')) return 'Chrome';
  return pkg.split('.').pop() ?? pkg;
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.targetName, { flex: 1, marginRight: 12 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: guardTokens.divider, true: guardTokens.focus }}
      />
    </View>
  );
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
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  customInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: guardTokens.divider,
    paddingHorizontal: 12,
    color: guardTokens.textPrimary,
    backgroundColor: guardTokens.elevated,
  },
  error: { color: guardTokens.warning, marginTop: 12 },
});
