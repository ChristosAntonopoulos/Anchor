import type { UnlockEvent } from 'phone-unlock';
import type { UsageSegment } from 'distraction-guard';
import { associateUnlockToDistraction, unlockToDistractionRate } from './policyEngine';

export type InsightObservation = {
  id: string;
  text: string;
};

export type InsightsSummary = {
  distractingMinutesByDay: { date: string; minutes: number; byPackage: Record<string, number> }[];
  unlockToDistractionRate: number | null;
  openingPromptDismissRate: number | null;
  monitoringCoverageLabel: string;
  observations: InsightObservation[];
};

function dayKey(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

export function buildInsights(params: {
  segments: UsageSegment[];
  unlocks: UnlockEvent[];
  windowSeconds: number;
  rangeStartMs: number;
  rangeEndMs: number;
  monitoringHealthy: boolean;
  openingPresented?: number;
  openingDismissed?: number;
}): InsightsSummary {
  const byDay = new Map<string, { minutes: number; byPackage: Record<string, number> }>();

  for (const seg of params.segments) {
    if (seg.endedAtMs < params.rangeStartMs || seg.startedAtMs > params.rangeEndMs) continue;
    if (seg.confidence !== 'verified') continue;
    const key = dayKey(seg.startedAtMs);
    const entry = byDay.get(key) ?? { minutes: 0, byPackage: {} };
    const mins = seg.durationMs / 60000;
    entry.minutes += mins;
    entry.byPackage[seg.packageName] = (entry.byPackage[seg.packageName] ?? 0) + mins;
    byDay.set(key, entry);
  }

  const distractingMinutesByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, minutes: Math.round(v.minutes * 10) / 10, byPackage: v.byPackage }));

  let eligible = 0;
  let followed = 0;
  for (const unlock of params.unlocks) {
    if (unlock.timestampMs < params.rangeStartMs || unlock.timestampMs > params.rangeEndMs) continue;
    eligible += 1;
    const first = params.segments
      .filter(
        (s) =>
          s.confidence === 'verified' &&
          s.startedAtMs >= unlock.timestampMs &&
          s.startedAtMs <= unlock.timestampMs + params.windowSeconds * 1000
      )
      .sort((a, b) => a.startedAtMs - b.startedAtMs)[0];
    if (
      associateUnlockToDistraction({
        unlockTimestampMs: unlock.timestampMs,
        firstDistractionStartMs: first?.startedAtMs ?? null,
        windowSeconds: params.windowSeconds,
      })
    ) {
      followed += 1;
    }
  }

  const observations: InsightObservation[] = [];
  if (distractingMinutesByDay.length > 0) {
    const eveningHeavy = params.segments.filter((s) => {
      const h = new Date(s.startedAtMs).getHours();
      return h >= 21;
    }).length;
    if (eveningHeavy >= 3) {
      observations.push({
        id: 'evening',
        text: 'Οι περισσότερες χρήσεις εμφανίζονται μετά τις 21:00.',
      });
    }
  }
  const rate = unlockToDistractionRate({
    eligibleUnlocks: eligible,
    unlocksFollowedByDistraction: followed,
  });
  if (rate != null && rate >= 0.4 && eligible >= 5) {
    observations.push({
      id: 'unlock',
      text: 'Συχνά ανοίγεις επιλεγμένο app αμέσως μετά το ξεκλείδωμα.',
    });
  }

  const dismissRate =
    params.openingPresented && params.openingPresented > 0
      ? (params.openingDismissed ?? 0) / params.openingPresented
      : null;

  return {
    distractingMinutesByDay,
    unlockToDistractionRate: rate,
    openingPromptDismissRate: dismissRate,
    monitoringCoverageLabel: params.monitoringHealthy
      ? 'Adequate monitoring for verified intervals'
      : 'Limited monitoring — usage access needed',
    observations: observations.slice(0, 3),
  };
}
