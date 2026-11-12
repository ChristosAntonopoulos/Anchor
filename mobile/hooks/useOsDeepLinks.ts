import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

function openOsUrl(url: string | null) {
  if (!url || !url.startsWith('pos:')) return;
  try {
    const parsed = new URL(url);
    const key = `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '').replace(/^\/+/, '');
    const route = key.replace(/^os\/?/, '') || parsed.hostname;
    switch (route) {
      case 'now':
      case 'os':
        router.replace('/(tabs)');
        break;
      case 'meals':
        router.push('/more/meals' as any);
        break;
      case 'block':
        router.push('/(tabs)/schedule');
        break;
      case 'deadlines':
        router.push('/more/deadlines' as any);
        break;
      case 'review':
        router.push('/more/weekly-review' as any);
        break;
      case 'tasks':
        router.push('/(tabs)/tasks');
        break;
      case 'discipline':
        router.push('/(tabs)/discipline');
        break;
      case 'morning':
        router.replace('/morning' as never);
        break;
      case 'night':
        router.replace('/night' as never);
        break;
      case 'capture':
        router.push('/check-in/capture' as never);
        break;
      case 'pipeline':
        router.replace('/(tabs)');
        break;
      default:
        break;
    }
  } catch {
    // ignore malformed
  }
}

export function useOsDeepLinks() {
  useEffect(() => {
    void Linking.getInitialURL().then(openOsUrl);
    const sub = Linking.addEventListener('url', ({ url }) => openOsUrl(url));
    return () => sub.remove();
  }, []);
}
