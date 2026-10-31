import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { getApiUrl } from '../../constants/apiConfig';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { parseAppRelease, shouldOfferUpdate, type AppRelease } from '../../utils/appUpdate';
import { isExpoGo } from '../../utils/nativeModuleSupport';

type InstallPhase = 'ready' | 'downloading' | 'permission' | 'failed';

type AppUpdateNativeModule = {
  installApk: (url: string) => Promise<boolean>;
};

const CHECK_TIMEOUT_MS = 8000;

function installedVersionCode(): number {
  const raw = Constants.nativeBuildVersion;
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number(raw);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  return '';
}

async function fetchRelease(): Promise<AppRelease | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(getApiUrl('/app/release'), { signal: controller.signal });
    if (response.status === 204 || !response.ok) {
      return null;
    }
    return parseAppRelease(await response.json());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function AppUpdatePrompt() {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [phase, setPhase] = useState<InstallPhase>('ready');

  useEffect(() => {
    if (Platform.OS !== 'android' || isExpoGo) {
      return;
    }
    const installer = NativeModules.AppUpdateModule as AppUpdateNativeModule | undefined;
    if (!installer) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const available = await fetchRelease();
        if (cancelled || !available) {
          return;
        }
        if (!shouldOfferUpdate(installedVersionCode(), available.versionCode)) {
          return;
        }
        setRelease(available);
      } catch (error) {
        console.error('[AppUpdatePrompt] Update check failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const install = async () => {
    const installer = NativeModules.AppUpdateModule as AppUpdateNativeModule | undefined;
    if (!installer || !release) {
      return;
    }

    setPhase('downloading');
    try {
      await installer.installApk(getApiUrl('/app/release/apk'));
      setRelease(null);
      setPhase('ready');
    } catch (error) {
      if (errorCode(error) === 'INSTALL_PERMISSION') {
        setPhase('permission');
        return;
      }
      setPhase('failed');
    }
  };

  const message = (() => {
    if (!release) {
      return '';
    }
    if (phase === 'downloading') {
      return 'Downloading the update. Android will ask you to confirm the install.';
    }
    if (phase === 'permission') {
      return 'Allow this app to install updates, then press OK.';
    }
    if (phase === 'failed') {
      return 'The update did not download. Press OK to try again.';
    }
    return `Version ${release.version} is ready. Press OK to install it.`;
  })();

  return (
    <Modal
      visible={release !== null}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (phase !== 'downloading') {
          setRelease(null);
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Update available</Text>
          <Text style={styles.message}>{message}</Text>
          {phase === 'downloading' ? (
            <ActivityIndicator color={colors.category.stability} style={styles.spinner} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setRelease(null);
                  setPhase('ready');
                }}
              >
                <Text style={styles.secondaryText}>Not now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => void install()}>
                <Text style={styles.primaryText}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.s,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  spinner: {
    marginTop: spacing.l,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.l,
    gap: spacing.s,
  },
  secondaryButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.body,
  },
  primaryButton: {
    backgroundColor: colors.category.stability,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
  },
  primaryText: {
    color: colors.background,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});
