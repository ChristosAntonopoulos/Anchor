import { router } from 'expo-router';

export { deepLinkFromNotificationData } from './osDeepLinkData';

/**
 * Maps Anchor `pos://…` URLs to Expo Router screens.
 * Shared by Linking listeners and notification-tap handlers so opens stay single-path.
 */
export function openOsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.startsWith('pos:')) return false;
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
        router.push('/more/meals' as never);
        break;
      case 'block':
        router.push('/(tabs)/schedule');
        break;
      case 'deadlines':
        router.push('/more/deadlines' as never);
        break;
      case 'review':
        router.push('/more/weekly-review' as never);
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
      case 'notifications':
        router.push('/more/notifications' as never);
        break;
      case 'pipeline':
        router.replace('/(tabs)');
        break;
      case 'capture':
        router.push('/check-in/capture' as never);
        break;
      default:
        return false;
    }
    return true;
  } catch {
    return false;
  }
}
