import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatMoney,
  isGoogleWalletNotification,
  parseWalletSpend,
  walletSpendSourceId,
} from './walletSpend.ts';

const walletPkg = 'com.google.android.apps.walletnfcrel';

test('recognises Google Wallet and Google Pay packages', () => {
  assert.equal(isGoogleWalletNotification(walletPkg), true);
  assert.equal(isGoogleWalletNotification('com.google.android.apps.nbu.paisa.user'), true);
  assert.equal(
    isGoogleWalletNotification('com.google.android.gms', 'Google Wallet', 'Paid', 'wallet'),
    true
  );
  assert.equal(isGoogleWalletNotification('com.google.android.gms', 'Gmail', 'New mail'), false);
  assert.equal(isGoogleWalletNotification('com.slack'), false);
});

test('parses euro tap-to-pay copy with a merchant', () => {
  const spend = parseWalletSpend({
    id: '42',
    packageName: walletPkg,
    title: 'Paid with Google Wallet',
    text: '€12.50 at Coffee Island',
    postTime: Date.parse('2026-11-08T12:00:00Z'),
  });
  assert.ok(spend);
  assert.equal(spend.amount, 12.5);
  assert.equal(spend.currency, 'EUR');
  assert.equal(spend.merchant, 'Coffee Island');
  assert.equal(spend.date, '2026-11-08');
  assert.equal(spend.sourceNotificationId, walletSpendSourceId(walletPkg, '42', Date.parse('2026-11-08T12:00:00Z')));
});

test('parses Greek decimal comma amounts', () => {
  const spend = parseWalletSpend({
    id: '7',
    packageName: walletPkg,
    title: 'Πληρωμή',
    text: 'Πληρώσατε 8,40 € στο AB Vassilopoulos',
    postTime: 1_700_000_000_000,
  });
  assert.ok(spend);
  assert.equal(spend.amount, 8.4);
  assert.equal(spend.currency, 'EUR');
  assert.equal(spend.merchant, 'AB Vassilopoulos');
});

test('uses the title as merchant when the body is only an amount', () => {
  const spend = parseWalletSpend({
    id: '9',
    packageName: walletPkg,
    title: 'Uber',
    text: 'You paid $18.20',
    postTime: 1_700_000_000_000,
  });
  assert.ok(spend);
  assert.equal(spend.merchant, 'Uber');
  assert.equal(spend.amount, 18.2);
  assert.equal(spend.currency, 'USD');
});

test('ignores boarding passes and other Wallet non-payments', () => {
  assert.equal(
    parseWalletSpend({
      id: '1',
      packageName: walletPkg,
      title: 'Google Wallet',
      text: 'Boarding pass added to Wallet',
      postTime: 1_700_000_000_000,
    }),
    null
  );
});

test('ignores notifications from other apps', () => {
  assert.equal(
    parseWalletSpend({
      id: '1',
      packageName: 'com.slack',
      title: 'Invoice',
      text: 'Paid €12.50 at Coffee',
      postTime: 1_700_000_000_000,
    }),
    null
  );
});

test('formats euro amounts in English', () => {
  assert.equal(formatMoney(12.5, 'EUR'), '€12.50');
});
