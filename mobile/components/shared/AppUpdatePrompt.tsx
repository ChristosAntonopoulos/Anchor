import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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

type InstallPhase = 'checking' | 'ready' | 'downloading' | 'installing' | 'permission' | 'failed';

type AppUpdateNativeModule = {
  installApk: (url: string) => Promise<boolean>;
  getInstalledVersionCode?: () => Promise<number>;
  canRequestPackageInstalls?: () => Promise<boolean>;
  openInstallPermissionSettings?: () => Promise<boolean>;
};

const CHECK_TIMEOUT_MS = 8000;

function fallbackInstalledVersionCode(): number {
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

function nativeInstaller(): AppUpdateNativeModule | undefined {
  return NativeModules.AppUpdateModule as AppUpdateNativeModule | undefined;
}

async function installedVersionCode(installer?: AppUpdateNativeModule): Promise<number> {
  try {
    const native = await installer?.getInstalledVersionCode?.();
    if (typeof native === 'number' && Number.isFinite(native)) {
      return native;
    }
  } catch {
    // Fall through to Constants.
  }
  return fallbackInstalledVersionCode();
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
  const [phase, setPhase] = useState<InstallPhase>('checking');
  const dismissedRef = useRef(false);
  const installingRef = useRef(false);
  const autoStartedForRef = useRef<number | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== 'android' || isExpoGo || dismissedRef.current) {
      return;
    }
    const installer = nativeInstaller();
    if (!installer) {
      return;
    }

    const available = await fetchRelease();
    if (!available) {
      return;
    }
    const installed = await installedVersionCode(installer);
    if (!shouldOfferUpdate(installed, available.versionCode)) {
      return;
    }
    setRelease(available);
  }, []);

  const install = useCallback(async () => {
    const installer = nativeInstaller();
    if (!installer || !release || installingRef.current) {
      return;
    }

    installingRef.current = true;
    setPhase('downloading');
    try {
      const allowed = installer.canRequestPackageInstalls
        ? await installer.canRequestPackageInstalls()
        : true;
      if (!allowed) {
        setPhase('permission');
        await installer.openInstallPermissionSettings?.();
        return;
      }
      await installer.installApk(getApiUrl('/app/release/apk'));
      setPhase('installing');
    } catch (error) {
      if (errorCode(error) === 'INSTALL_PERMISSION') {
        setPhase('permission');
        return;
      }
      setPhase('failed');
    } finally {
      installingRef.current = false;
    }
  }, [release]);

  useEffect(() => {
    void checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || dismissedRef.current) {
        return;
      }
      if (release && phase === 'permission') {
        void install();
        return;
      }
      if (!release) {
        void checkForUpdate();
      }
    });
    return () => sub.remove();
  }, [checkForUpdate, install, phase, release]);

  useEffect(() => {
    if (!release || dismissedRef.current) {
      return;
    }
    if (autoStartedForRef.current === release.versionCode) {
      return;
    }
    autoStartedForRef.current = release.versionCode;
    void install();
  }, [install, release]);

  if (!release) {
    return null;
  }

  const message = (() => {
    if (phase === 'downloading') {
      return `Κατεβάζω την έκδοση ${release.version} και ανοίγω την εγκατάσταση.`;
    }
    if (phase === 'installing') {
      return 'Το Android ζητά επιβεβαίωση. Πάτα Εγκατάσταση στο επόμενο παράθυρο.';
    }
    if (phase === 'permission') {
      return 'Επίτρεψε την εγκατάσταση από αυτή την εφαρμογή. Μόλις επιστρέψεις, συνεχίζω μόνος μου.';
    }
    if (phase === 'failed') {
      return 'Η ενημέρωση δεν κατέβηκε. Πατάω Εγκατάσταση για νέα προσπάθεια.';
    }
    return `Η έκδοση ${release.version} είναι έτοιμη. Ξεκινάει η εγκατάσταση.`;
  })();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (phase !== 'downloading' && phase !== 'installing') {
          dismissedRef.current = true;
          setRelease(null);
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Ενημέρωση εφαρμογής</Text>
          <Text style={styles.message}>{message}</Text>
          {phase === 'downloading' || phase === 'installing' ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  dismissedRef.current = true;
                  setRelease(null);
                  setPhase('ready');
                }}
              >
                <Text style={styles.secondaryText}>Αργότερα</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={() => void install()}>
                <Text style={styles.primaryText}>
                  {phase === 'permission' ? 'Συνέχεια' : 'Εγκατάσταση'}
                </Text>
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
  },
  primaryText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});
