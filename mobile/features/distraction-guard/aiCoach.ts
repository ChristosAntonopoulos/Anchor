import { pickReplacementAction } from './policyEngine';

export type ReplacementAction = {
  title: string;
  instruction: string;
  estimatedSeconds: number;
  linkedTaskId: string | null;
  easierAlternative: string;
  category: string;
  source: 'predefined' | 'ai';
};

export type StuckHelp = {
  action: string;
  source: 'predefined' | 'ai';
};

export type WeeklyReflection = {
  observations: string[];
  dataQualityWarning: string | null;
  proposedChange: string | null;
  supportingReason: string | null;
  confidence: 'low' | 'medium' | 'high';
  requiresApproval: true;
  source: 'predefined' | 'ai';
};

/**
 * AI Call A — Replacement action.
 * Uses predefined fallback when offline / no AI service.
 */
export async function getReplacementAction(_ctx?: {
  timeOfDayHour?: number;
}): Promise<ReplacementAction> {
  const pick = pickReplacementAction();
  return {
    title: pick.title,
    instruction: pick.instruction,
    estimatedSeconds: pick.estimatedSeconds,
    linkedTaskId: null,
    easierAlternative: pick.easierAlternative,
    category: pick.category,
    source: 'predefined',
  };
}

/** AI Call B — I'm stuck */
export async function getStuckHelp(): Promise<StuckHelp> {
  const options = ['Put the phone down.', 'Get up from the chair.', 'Open only the project.'];
  return { action: options[Date.now() % options.length], source: 'predefined' };
}

/** AI Call C — Weekly reflection (aggregates only; never mutates settings). */
export async function getWeeklyReflection(input: {
  verifiedDistractingMinutes: number;
  unlockToDistractionRate: number | null;
  monitoringHealthy: boolean;
}): Promise<WeeklyReflection> {
  const observations: string[] = [];
  if (input.verifiedDistractingMinutes > 0) {
    observations.push(
      `Verified minutes in selected apps: ${Math.round(input.verifiedDistractingMinutes)}.`
    );
  }
  if (input.unlockToDistractionRate != null) {
    observations.push(
      `Unlock-to-distraction rate: ${Math.round(input.unlockToDistractionRate * 100)}%.`
    );
  }
  return {
    observations: observations.slice(0, 2),
    dataQualityWarning: input.monitoringHealthy
      ? null
      : 'Monitoring coverage is limited; treat patterns as incomplete.',
    proposedChange:
      input.unlockToDistractionRate != null && input.unlockToDistractionRate >= 0.45
        ? 'Enable a short opening pause before Instagram in the evening.'
        : null,
    supportingReason:
      input.unlockToDistractionRate != null && input.unlockToDistractionRate >= 0.45
        ? 'Observed unlocks often led quickly to a selected app.'
        : null,
    confidence: input.monitoringHealthy ? 'medium' : 'low',
    requiresApproval: true,
    source: 'predefined',
  };
}
