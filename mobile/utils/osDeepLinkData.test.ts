import assert from 'node:assert/strict';
import test from 'node:test';
import { deepLinkFromNotificationData } from './osDeepLinkData';

test('deepLinkFromNotificationData prefers url then deepLink', () => {
  assert.equal(
    deepLinkFromNotificationData({ url: 'pos://os/night', deepLink: 'pos://os/now' }),
    'pos://os/night'
  );
  assert.equal(deepLinkFromNotificationData({ deepLink: 'pos://os/tasks' }), 'pos://os/tasks');
  assert.equal(deepLinkFromNotificationData({ url: 'https://example.com' }), null);
  assert.equal(deepLinkFromNotificationData({}), null);
  assert.equal(deepLinkFromNotificationData(null), null);
});
