export interface FeelingRatingLike {
  code?: string;
  customLabel?: string;
  intensity?: number | null;
  phase?: string;
}

export interface CheckInLike {
  text?: string;
  title?: string;
  mood?: string;
  moodIntensity?: number | null;
  feelings?: FeelingRatingLike[];
  recordState?: string;
  schemaVersion?: number;
  thoughtState?: string;
  situation?: string;
  automaticThoughts?: { text?: string }[];
  problemSolving?: object | null;
}

export interface PlanLike {
  id: string;
  lifecycle?: string;
  isCompleted?: boolean;
  scheduledDate?: string;
}

export interface TemplateLike {
  id: string;
}

const FEELING_LABELS: Record<string, string> = {
  anxious: 'Anxious',
  sad_low: 'Sad / low',
  frustrated_angry: 'Frustrated / angry',
  overwhelmed: 'Overwhelmed',
  lonely: 'Lonely',
  ashamed_guilty: 'Ashamed / guilty',
  calm: 'Calm',
  happy_content: 'Happy / content',
  hopeful: 'Hopeful',
  other: 'Other',
  not_sure: 'Not sure',
  numb_disconnected: 'Numb / disconnected',
  tired: 'Tired',
  confused: 'Confused',
};

const CRISIS_MARKERS = [
  'suicide',
  'kill myself',
  'killing myself',
  'end my life',
  'want to die',
  'take my life',
  'self-harm',
  'self harm',
  'hurt myself',
  "don't want to be alive",
  'dont want to be alive',
];

export function feelingLabel(code?: string, customLabel?: string): string {
  if (customLabel) {
    return customLabel;
  }
  if (code && code in FEELING_LABELS) {
    return FEELING_LABELS[code];
  }
  return code ?? '';
}

export function formatFeeling(feeling: FeelingRatingLike): string {
  const label = feelingLabel(feeling.code, feeling.customLabel);
  if (feeling.intensity == null) {
    return label;
  }
  return `${label}, ${feeling.intensity}/10`;
}

export function looksLikeImmediateDanger(text?: string | null): boolean {
  if (!text) {
    return false;
  }
  const lower = text.toLowerCase();
  return CRISIS_MARKERS.some((marker) => lower.includes(marker));
}

export function entryPreview(entry: CheckInLike): string {
  const text = entry.text?.trim();
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117).trimEnd()}…` : text;
  }
  if (entry.feelings && entry.feelings.length > 0) {
    return entry.feelings.map(formatFeeling).join(' · ');
  }
  return 'A few words are enough.';
}

export function entryTitle(entry: CheckInLike): string {
  if (entry.title?.trim()) {
    return entry.title.trim();
  }
  return entryPreview(entry);
}

export function isDraft(entry: CheckInLike): boolean {
  return entry.recordState === 'draft';
}

export function isCheckInRecord(entry: CheckInLike): boolean {
  return (entry.schemaVersion ?? 1) >= 2;
}

export function deviceTimezone(): { timezone: string; utcOffsetMinutes: number } {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
  };
}

export function groupActivityPlans<T extends PlanLike>(plans: T[]) {
  const ready: T[] = [];
  const planned: T[] = [];
  const previously: T[] = [];

  plans.forEach((plan) => {
    const life = plan.lifecycle ?? (plan.isCompleted ? 'completed' : 'planned');
    if (life === 'in_progress' || life === 'selected') {
      ready.push(plan);
    } else if (life === 'completed' || life === 'partially_completed' || life === 'not_attempted' || life === 'cancelled') {
      previously.push(plan);
    } else {
      planned.push(plan);
    }
  });

  return { ready, planned, previously };
}

export function resolveTemplate<T extends TemplateLike>(
  templates: T[],
  templateId?: string
): T | undefined {
  return templates.find((template) => template.id === templateId);
}

export function effortLabel(effort?: string, minutes?: number): string {
  const duration = minutes ? `${minutes} minute${minutes === 1 ? '' : 's'}` : null;
  const level =
    effort === 'low' ? 'Low effort' : effort === 'medium' ? 'Medium effort' : effort === 'higher' ? 'Higher effort' : null;
  return [duration, level].filter(Boolean).join(' · ');
}

export function historyKind(entry: CheckInLike): 'checkin' | 'thought' | 'problem' | 'legacy' | 'draft' {
  if (isDraft(entry)) {
    return 'draft';
  }
  if (entry.problemSolving) {
    return 'problem';
  }
  if (entry.thoughtState || entry.situation || (entry.automaticThoughts?.length ?? 0) > 0) {
    return 'thought';
  }
  if (!isCheckInRecord(entry)) {
    return 'legacy';
  }
  return 'checkin';
}

export function confirmedFeelings(entry: CheckInLike): FeelingRatingLike[] {
  if (entry.feelings && entry.feelings.length > 0) {
    return entry.feelings.filter((feeling) => feeling.phase !== 'after');
  }
  if (entry.mood) {
    return [
      {
        customLabel: entry.mood,
        intensity: entry.moodIntensity,
        phase: 'before',
      },
    ];
  }
  return [];
}
