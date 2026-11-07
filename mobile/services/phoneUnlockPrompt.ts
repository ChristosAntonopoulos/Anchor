import { NativeModules, Platform } from 'react-native';
import { apiClient } from './api';
import { hasPhoneUnlockModule } from '../utils/nativeModuleSupport';
import {
  PHONE_UNLOCK_SCHEMA_VERSION,
  fieldsForUnlockChoice,
  type UnlockPromptAction,
  type UnlockPromptStatus,
  type UnlockPutDownExecution,
  type UnlockSubmissionPath,
} from '../utils/phoneUnlockMapping';
import type { CreatePhoneUnlockEntryRequest } from '../types';

const nativeModule = NativeModules.PhoneUnlockModule as
  | {
      beginUnlockPrompt?: (unlockTimeMs: number) => Promise<string>;
      resolveUnlockPrompt?: (payload: Record<string, unknown>) => Promise<boolean>;
      syncUnlockPrompts?: () => void;
    }
  | undefined;

export interface ResolveUnlockPromptInput {
  promptId: string;
  unlockTime: number;
  skip: boolean;
  keepContext: boolean;
  contextExpanded: boolean;
  intention: string | null;
  trigger: string | null;
  feeling: string | null;
  note: string | null;
  action: UnlockPromptAction | null;
  status: UnlockPromptStatus;
  path: UnlockSubmissionPath | null;
  putDownExecution: UnlockPutDownExecution | null;
}

function utcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export async function beginUnlockPrompt(unlockTime: number): Promise<string> {
  if (Platform.OS === 'android' && hasPhoneUnlockModule && nativeModule?.beginUnlockPrompt) {
    try {
      return await nativeModule.beginUnlockPrompt(unlockTime);
    } catch (error) {
      console.error('[PhoneUnlockPrompt] Could not begin local prompt', error);
    }
  }
  return `unlock-prompt-${unlockTime}`;
}

export async function resolveUnlockPrompt(input: ResolveUnlockPromptInput): Promise<void> {
  const fields = fieldsForUnlockChoice(input);
  const shownAtUtc = new Date(input.unlockTime).toISOString();
  const payload: CreatePhoneUnlockEntryRequest = {
    promptId: input.promptId,
    schemaVersion: PHONE_UNLOCK_SCHEMA_VERSION,
    unlockEventId: `unlock-${input.unlockTime}`,
    shownAtUtc,
    utcOffsetMinutesAtShown: utcOffsetMinutes(),
    resolvedAtUtc: new Date().toISOString(),
    unlockedAt: shownAtUtc,
    ...fields,
  };

  if (Platform.OS === 'android' && hasPhoneUnlockModule && nativeModule?.resolveUnlockPrompt) {
    try {
      await nativeModule.resolveUnlockPrompt({
        id: input.promptId,
        ...fields,
      });
      nativeModule.syncUnlockPrompts?.();
      return;
    } catch (error) {
      console.error('[PhoneUnlockPrompt] Local resolve failed; trying API', error);
    }
  }

  try {
    await apiClient.createPhoneUnlockEntry(payload);
  } catch (error) {
    console.error('[PhoneUnlockPrompt] Could not sync unlock prompt', error);
  }
}
