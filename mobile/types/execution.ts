export type TimerStyle = 'countdown' | 'elapsed' | 'none';
export type SessionStatus = 'setup' | 'running' | 'paused' | 'time_check' | 'finished';
export type CapacityChoice = '5' | '15' | '30' | 'unsure';

export interface NextAction {
  text: string;
  estimatedMinutes?: number | null;
  estimateBasis?: 'unknown' | 'user' | 'rough_ai_estimate';
  source?: 'user' | 'accepted_ai' | 'suggested_ai';
}

export interface UpcomingStep {
  text: string;
  order: number;
}

export interface TaskPlanSuggestion {
  status: 'suggestion' | 'needs_question';
  question?: string | null;
  nextAction?: NextAction | null;
  upcomingSteps: UpcomingStep[];
  definitionOfDone?: string | null;
  dependencies: string[];
  reason: string;
  assumptions: string[];
}

export interface UnavailablePeriod {
  label: string;
  start?: string | null;
  end?: string | null;
}

export interface ProfileNote {
  text: string;
  kind: 'observation' | 'hypothesis';
  createdAt: string;
}

export interface ExecutionProfile {
  id: string;
  preferredWorkingHoursStart: string;
  preferredWorkingHoursEnd: string;
  typicalUnavailablePeriods: UnavailablePeriod[];
  preferredInitialSessionMinutes: number;
  preferredTimerStyle: TimerStyle;
  breakReminders: boolean;
  countdownsFeelHelpful: boolean;
  aiPromptingLevel: 'quieter' | 'normal' | 'more';
  commonWorkContexts: string[];
  statedObstacles: string[];
  strategiesThatHelp: string[];
  strategiesThatDoNotHelp: string[];
  lastExplicitDurationMinutes: number;
  timezone?: string | null;
  observations: ProfileNote[];
  hypotheses: ProfileNote[];
}

export interface WorkSession {
  id: string;
  taskId?: string | null;
  taskTitle?: string | null;
  blockId?: string | null;
  status: SessionStatus;
  currentAction: string;
  plannedMinutes?: number | null;
  timerEnabled: boolean;
  timerStyle: TimerStyle;
  startedAt?: string | null;
  elapsedMs: number;
  returnPoint?: string | null;
  notes?: string | null;
  finishOutcome?: string | null;
  upcomingSteps: string[];
}

export interface RecoveryCard {
  blockId: string;
  taskId?: string | null;
  title: string;
  message: string;
  nextAction: string;
  suggestedStartMinutes: number;
}

export interface NowRecommendation {
  activeSession?: WorkSession | null;
  taskId?: string | null;
  taskTitle?: string | null;
  nextAction: string;
  suggestedStartMinutes: number;
  reason: string;
  alternativeTaskId?: string | null;
  alternativeTitle?: string | null;
  constraintWarnings: string[];
  question?: string | null;
  recovery?: RecoveryCard | null;
  usedAi: boolean;
}

export interface StuckHelp {
  approach: string;
  suggestedAction: string;
  suggestedMinutes?: number | null;
  explanation: string;
  question?: string | null;
  alternative?: string | null;
  usedAi: boolean;
}

export interface ProposedBlock {
  taskId?: string | null;
  taskTitle?: string | null;
  startLocal: string;
  endLocal: string;
  timezone: string;
  entryAction: string;
  startMinutes: number;
  reason: string;
  estimateUncertain: boolean;
}

export interface DayPlan {
  id: string;
  status: string;
  summary: string;
  firstTaskId?: string | null;
  proposedBlocks: ProposedBlock[];
  unscheduledTaskIds: string[];
  deadlineRisks: string[];
  assumptions: string[];
  question?: string | null;
  usedAi: boolean;
}

export interface ReturnPointDraft {
  returnPoint: string;
  nextAction: string;
  question?: string | null;
  usedAi: boolean;
}

export interface AdaptRoutine {
  recommendedVersion: 'regular' | 'shorter' | 'skip';
  reason: string;
  suggestedShorterSteps: string[];
  question?: string | null;
  usedAi: boolean;
}

export interface SessionLaunch {
  taskId?: string;
  blockId?: string;
  title?: string;
  currentAction?: string;
  minutes?: number;
}

export interface ExecutionReview {
  observations: string[];
  hypotheses: string[];
  suggestedProfileTweaks: string[];
  question?: string | null;
  usedAi: boolean;
}
