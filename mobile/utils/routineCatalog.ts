/**
 * Mobile mirror of backend POS.Core.Schedule.RoutineCatalog (SSOT).
 * Keep in sync with RoutineCatalog.cs — schedule blocks and immersive modes
 * must show the same windows and step titles.
 */
export const ROUTINE_CATALOG_VERSION = 'unify-v1';

export interface RoutineStepDef {
  id: string;
  title: string;
  seconds: number;
  command: string;
}

export interface UnifiedRoutineDef {
  key: 'morning' | 'night';
  title: string;
  startTime: string;
  endTime: string;
  triggerHour: number;
  triggerMinute: number;
  totalSeconds: number;
  steps: RoutineStepDef[];
  shorterSteps: RoutineStepDef[];
}

export const MORNING_ROUTINE: UnifiedRoutineDef = {
  key: 'morning',
  title: 'Morning Routine',
  startTime: '07:00',
  endTime: '07:45',
  triggerHour: 7,
  triggerMinute: 0,
  totalSeconds: 1800,
  steps: [
    { id: 'water', title: 'Drink water', seconds: 120, command: 'Open curtains if you want. Drink a glass of water.' },
    { id: 'move', title: 'Light movement', seconds: 300, command: 'Gentle indoor movement: march, shoulders, a few stands, stretch.' },
    { id: 'brush', title: 'Brush / hygiene', seconds: 240, command: 'Brush teeth and a quick wash.' },
    { id: 'settle', title: 'Short settle', seconds: 780, command: 'Sit quietly. Soft breath. When the mind wanders, come back.' },
    { id: 'task', title: 'First work task', seconds: 360, command: "Do only the first physical move of today's first task." },
  ],
  shorterSteps: [
    { id: 'water', title: 'Drink water', seconds: 120, command: 'Drink a glass of water.' },
    { id: 'task', title: 'First work task', seconds: 360, command: 'Do only the first physical move.' },
  ],
};

export const NIGHT_ROUTINE: UnifiedRoutineDef = {
  key: 'night',
  title: 'Evening Routine',
  startTime: '21:30',
  endTime: '22:15',
  triggerHour: 21,
  triggerMinute: 30,
  totalSeconds: 1800,
  steps: [
    { id: 'screens', title: 'Screens down', seconds: 300, command: 'Dim lights. Close feeds and chats. Lower brightness. Phone face-down.' },
    { id: 'read', title: 'Short read', seconds: 480, command: 'Read a few calm pages. No feeds.' },
    { id: 'brush', title: 'Brush teeth', seconds: 180, command: 'Wash up / brush teeth gently.' },
    { id: 'breathe', title: 'Quiet breath', seconds: 180, command: 'Soft nose inhale count four, longer exhale count six. Two quiet rounds.' },
    { id: 'close', title: 'Tomorrow first step', seconds: 660, command: 'Write one small first step for tomorrow. Phone charging away from bed.' },
  ],
  shorterSteps: [
    { id: 'screens', title: 'Screens down', seconds: 300, command: 'Close screens. Phone face-down.' },
    { id: 'breathe', title: 'Quiet breath', seconds: 180, command: 'Two quiet breath rounds.' },
    { id: 'close', title: 'Tomorrow first step', seconds: 660, command: 'One tomorrow step. Phone away.' },
  ],
};

export function stepSecondsMap<T extends string>(
  steps: RoutineStepDef[]
): Record<T, number> {
  return Object.fromEntries(steps.map((s) => [s.id, s.seconds])) as Record<T, number>;
}

export function stepOrder<T extends string>(steps: RoutineStepDef[]): T[] {
  return steps.map((s) => s.id as T);
}
