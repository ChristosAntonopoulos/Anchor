/** Resolve deep link from Expo notification content.data (url or deepLink). */
export function deepLinkFromNotificationData(
  data: Record<string, unknown> | undefined | null
): string | null {
  if (!data) return null;
  const url = data.url ?? data.deepLink;
  if (typeof url === 'string' && url.startsWith('pos:')) return url;
  return null;
}
