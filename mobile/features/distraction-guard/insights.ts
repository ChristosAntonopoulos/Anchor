import type { UnlockEvent, UsageSegment } from 'distraction-guard';
import {
  associateUnlockToDistraction,
  isWithinSchedule,
  unlockToDistractionRate,
} from './policyEngine';

export type InsightObservation = {
  id: string;
  text: string;
};

export type InsightsSummary = {
  distractingMinutesByDay: {
    date: string;
    minutes: number;
    byPackage: Record<string, number>;
  }[];
  unlockToDistractionRate: number | null;
  openingPromptDismissRate: number | null;
  monitoringCoverageLabel: string;
  observations: InsightObservation[];
};

function dayKey(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

function packageLabel(pkg: string): string {
  if (pkg.includes('instagram')) return 'Instagram';
  if (pkg.includes('youtube')) return 'YouTube';
  if (pkg.includes('chrome')) return 'Browser';
  return pkg;
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
  analyzeUnlockPatterns?: boolean;
  scheduleFilter?: {
    startMinutes: number;
    endMinutes: number;
    activeDays: number[];
  };
}): InsightsSummary {
  const byDay = new Map<string, { minutes: number; byPackage: Record<string, number> }>();

  for (const seg of params.segments) {
    if (seg.endedAtMs < params.rangeStartMs || seg.startedAtMs > params.rangeEndMs) continue;
    if (seg.confidence !== 'verified') continue;
    const key = dayKey(seg.startedAtMs);
    const entry = byDay.get(key) ?? { minutes: 0, byPackage: {} };
    const mins = seg.durationMs / 60000;
    entry.minutes += mins;
    const label = packageLabel(seg.packageName);
    entry.byPackage[label] = (entry.byPackage[label] ?? 0) + mins;
    byDay.set(key, entry);
  }

  const distractingMinutesByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      minutes: Math.round(v.minutes * 10) / 10,
      byPackage: Object.fromEntries(
        Object.entries(v.byPackage).map(([k, mins]) => [k, Math.round(mins * 10) / 10])
      ),
    }));

  let eligible = 0;
  let followed = 0;
  if (params.analyzeUnlockPatterns !== false && params.monitoringHealthy) {
    for (const unlock of params.unlocks) {
      if (unlock.timestampMs < params.rangeStartMs || unlock.timestampMs > params.rangeEndMs) {
        continue;
      }
      if (params.scheduleFilter) {
        const inSchedule = isWithinSchedule({
          nowMs: unlock.timestampMs,
          startMinutes: params.scheduleFilter.startMinutes,
          endMinutes: params.scheduleFilter.endMinutes,
          activeDays: params.scheduleFilter.activeDays,
        });
        if (!inSchedule) continue;
      }
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
  }

  const observations: InsightObservation[] = [];
  if (distractingMinutesByDay.length > 0) {
    const eveningHeavy = params.segments.filter((s) => {
      const h = new Date(s.startedAtMs).getHours();
      return h >= 21 && s.confidence === 'verified';
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
  if (dismissRate != null && dismissRate >= 0.35 && (params.openingPresented ?? 0) >= 4) {
    observations.push({
      id: 'friction',
      text: 'Οι σύντομες παύσεις φαίνεται να σε βοηθούν να επιστρέφεις.',
    });
  }

  return {
    distractingMinutesByDay,
    unlockToDistractionRate: rate,
    openingPromptDismissRate: dismissRate,
    monitoringCoverageLabel: params.monitoringHealthy
      ? 'Επαρκής παρακολούθηση (verified διαστήματα)'
      : 'Περιορισμένη παρακολούθηση — χρειάζεται Usage Access',
    observations: observations.slice(0, 3),
  };
}
