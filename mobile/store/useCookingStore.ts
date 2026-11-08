import { create } from 'zustand';
import {
  cancelTimerNotification,
  playTimerDoneAlert,
  scheduleTimerNotification,
} from '../utils/cookingAlerts';

export interface CookTimer {
  id: string;
  slotId: string;
  planId: string;
  recipeName: string;
  stepNumber: number;
  action: string;
  durationSeconds: number;
  endsAt: number;
  status: 'running' | 'done';
  notified: boolean;
  notificationId?: string | null;
}

interface CookingStore {
  timers: CookTimer[];
  doneSteps: Record<string, boolean>;
  startTimer: (input: {
    slotId: string;
    planId: string;
    recipeName: string;
    stepNumber: number;
    action: string;
    durationMinutes: number;
  }) => Promise<void>;
  markStepDone: (slotId: string, stepNumber: number) => void;
  isStepDone: (slotId: string, stepNumber: number) => boolean;
  tick: () => void;
  clearSlot: (slotId: string) => void;
}

function timerId(slotId: string, stepNumber: number) {
  return `${slotId}:${stepNumber}`;
}

function stepKey(slotId: string, stepNumber: number) {
  return timerId(slotId, stepNumber);
}

export const useCookingStore = create<CookingStore>((set, get) => ({
  timers: [],
  doneSteps: {},

  startTimer: async ({ slotId, planId, recipeName, stepNumber, action, durationMinutes }) => {
    const id = timerId(slotId, stepNumber);
    const durationSeconds = Math.max(1, Math.round(durationMinutes * 60));
    const endsAt = Date.now() + durationSeconds * 1000;
    const notificationId = await scheduleTimerNotification(
      recipeName || 'Cooking',
      `${action} — ready`,
      durationSeconds
    );

    set((state) => ({
      timers: [
        ...state.timers.filter((t) => t.id !== id),
        {
          id,
          slotId,
          planId,
          recipeName,
          stepNumber,
          action,
          durationSeconds,
          endsAt,
          status: 'running',
          notified: false,
          notificationId,
        },
      ],
    }));
  },

  markStepDone: (slotId, stepNumber) => {
    const id = timerId(slotId, stepNumber);
    const existing = get().timers.find((t) => t.id === id);
    void cancelTimerNotification(existing?.notificationId);
    set((state) => ({
      doneSteps: { ...state.doneSteps, [stepKey(slotId, stepNumber)]: true },
      timers: state.timers.map((t) =>
        t.id === id ? { ...t, status: 'done', notified: true } : t
      ),
    }));
  },

  isStepDone: (slotId, stepNumber) => !!get().doneSteps[stepKey(slotId, stepNumber)],

  tick: () => {
    const now = Date.now();
    const justDone: CookTimer[] = [];
    set((state) => ({
      timers: state.timers.map((t) => {
        if (t.status === 'running' && t.endsAt <= now) {
          justDone.push(t);
          return { ...t, status: 'done' };
        }
        return t;
      }),
      doneSteps: justDone.reduce(
        (acc, t) => ({ ...acc, [stepKey(t.slotId, t.stepNumber)]: true }),
        state.doneSteps
      ),
    }));

    justDone.forEach((t) => {
      if (!t.notified) {
        playTimerDoneAlert();
        set((state) => ({
          timers: state.timers.map((x) => (x.id === t.id ? { ...x, notified: true } : x)),
        }));
      }
    });
  },

  clearSlot: (slotId) => {
    get()
      .timers.filter((t) => t.slotId === slotId)
      .forEach((t) => void cancelTimerNotification(t.notificationId));
    set((state) => {
      const doneSteps = { ...state.doneSteps };
      Object.keys(doneSteps).forEach((k) => {
        if (k.startsWith(`${slotId}:`)) delete doneSteps[k];
      });
      return {
        timers: state.timers.filter((t) => t.slotId !== slotId),
        doneSteps,
      };
    });
  },
}));
