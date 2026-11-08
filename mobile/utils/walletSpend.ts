import type { Notification, NotificationData } from '../types/notifications';

export const GOOGLE_WALLET_PACKAGES = [
  'com.google.android.apps.walletnfcrel',
  'com.google.android.apps.nbu.paisa.user',
  'com.google.android.apps.walleted',
] as const;

const WALLET_PACKAGE_HINTS = ['walletnfcrel', 'nbu.paisa', 'tapandpay', 'walleted'];

const GENERIC_TITLES = [
  'paid',
  'payment',
  'payment successful',
  'google wallet',
  'google pay',
  'gpay',
  'you paid',
  'paid with google pay',
  'paid with google wallet',
  'tap to pay',
  'wallet',
  'πληρωμή',
  'πληρώσατε',
];

const PASS_HINTS = [
  'boarding pass',
  'loyalty',
  'added to wallet',
  'ticket is ready',
  'pass is ready',
  'expires',
  'event ticket',
  'gift card',
];

export interface ParsedWalletSpend {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  sourceNotificationId: string;
  packageName: string;
  rawText: string;
}

export function walletSpendSourceId(packageName: string, notificationId: string, postTime: number): string {
  return `${packageName}:${notificationId}:${postTime}`;
}

export function isGoogleWalletNotification(
  packageName: string,
  appName?: string | null,
  title?: string | null,
  channelName?: string | null
): boolean {
  const pkg = (packageName || '').toLowerCase();
  if (GOOGLE_WALLET_PACKAGES.includes(pkg as (typeof GOOGLE_WALLET_PACKAGES)[number])) {
    return true;
  }
  if (WALLET_PACKAGE_HINTS.some((hint) => pkg.includes(hint))) {
    return true;
  }
  if (pkg === 'com.google.android.gms' || pkg === 'com.google.android.gsf') {
    const blob = `${appName ?? ''} ${title ?? ''} ${channelName ?? ''}`.toLowerCase();
    return /wallet|google pay|\bgpay\b|tap.?and.?pay/.test(blob);
  }
  return false;
}

export function parseWalletSpend(
  notification: Pick<
    NotificationData & Notification,
    'id' | 'title' | 'text' | 'subText' | 'packageName' | 'postTime' | 'appName' | 'largeText' | 'channelName'
  > & { notificationId?: string }
): ParsedWalletSpend | null {
  if (
    !isGoogleWalletNotification(
      notification.packageName,
      notification.appName,
      notification.title,
      notification.channelName
    )
  ) {
    return null;
  }

  const raw = [notification.title, notification.text, notification.subText, notification.largeText]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) {
    return null;
  }

  const lower = raw.toLowerCase();
  if (PASS_HINTS.some((hint) => lower.includes(hint)) && !hasAmount(raw)) {
    return null;
  }

  const money = extractAmount(raw);
  if (!money) {
    return null;
  }

  const postTime =
    typeof notification.postTime === 'number'
      ? notification.postTime
      : Date.parse(String(notification.postTime));
  if (!Number.isFinite(postTime)) {
    return null;
  }

  const androidId = notification.notificationId || notification.id || '0';
  return {
    date: new Date(postTime).toISOString().slice(0, 10),
    merchant: extractMerchant(notification.title, raw),
    amount: money.amount,
    currency: money.currency,
    sourceNotificationId: walletSpendSourceId(notification.packageName, String(androidId), postTime),
    packageName: notification.packageName,
    rawText: raw.slice(0, 400),
  };
}

function hasAmount(text: string): boolean {
  return extractAmount(text) != null;
}

function extractAmount(text: string): { amount: number; currency: string } | null {
  const patterns: Array<{ re: RegExp; currency: (match: RegExpExecArray) => string; value: (match: RegExpExecArray) => string }> = [
    { re: /(?:€|eur)\s*(\d{1,6}(?:[.,]\d{2})?)/i, currency: () => 'EUR', value: (m) => m[1] },
    { re: /(\d{1,6}(?:[.,]\d{2})?)\s*(?:€|eur)/i, currency: () => 'EUR', value: (m) => m[1] },
    { re: /(?:£|gbp)\s*(\d{1,6}(?:[.,]\d{2})?)/i, currency: () => 'GBP', value: (m) => m[1] },
    { re: /(\d{1,6}(?:[.,]\d{2})?)\s*(?:£|gbp)/i, currency: () => 'GBP', value: (m) => m[1] },
    { re: /(?:\$|usd)\s*(\d{1,6}(?:[.,]\d{2})?)/i, currency: () => 'USD', value: (m) => m[1] },
    { re: /(\d{1,6}(?:[.,]\d{2})?)\s*(?:\$|usd)/i, currency: () => 'USD', value: (m) => m[1] },
  ];

  for (const pattern of patterns) {
    const match = pattern.re.exec(text);
    if (!match) continue;
    const amount = parseLocaleAmount(pattern.value(match));
    if (amount != null && amount > 0) {
      return { amount, currency: pattern.currency(match) };
    }
  }
  return null;
}

function parseLocaleAmount(raw: string): number | null {
  const normalized = raw.includes(',') && !raw.includes('.')
    ? raw.replace(',', '.')
    : raw.replace(/,/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function extractMerchant(title: string | undefined, raw: string): string {
  const at =
    /(?:\b(?:at|to|from)\b|(?:^|\s)(?:στο|σε|στον|στην))\s+(.+)$/iu.exec(raw);
  if (at?.[1]) {
    const merchant = cleanMerchant(at[1]);
    if (merchant) return merchant;
  }

  const cleanedTitle = cleanMerchant(title ?? '');
  if (cleanedTitle && !isGenericTitle(cleanedTitle)) {
    return cleanedTitle;
  }

  return 'Google Wallet';
}

function cleanMerchant(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[·•|]+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim();
}

function isGenericTitle(value: string): boolean {
  const lower = value.toLowerCase();
  return GENERIC_TITLES.includes(lower);
}

export function formatMoney(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
