import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAppRelease, shouldOfferUpdate } from './appUpdate.ts';

test('offers an update only when the published versionCode is newer', () => {
  assert.equal(shouldOfferUpdate(10, 11), true);
  assert.equal(shouldOfferUpdate(11, 11), false);
  assert.equal(shouldOfferUpdate(12, 11), false);
  assert.equal(shouldOfferUpdate(Number.NaN, 11), false);
  assert.equal(shouldOfferUpdate(10, 0), false);
});

test('parses a published release payload', () => {
  const parsed = parseAppRelease({
    version: '1.0.761',
    versionCode: 761,
    releasedAt: '2026-11-07T19:00:00Z',
  });
  assert.deepEqual(parsed, {
    version: '1.0.761',
    versionCode: 761,
    releasedAt: '2026-11-07T19:00:00Z',
  });
});

test('rejects empty or invalid release payloads', () => {
  assert.equal(parseAppRelease(null), null);
  assert.equal(parseAppRelease({ version: '', versionCode: 1 }), null);
  assert.equal(parseAppRelease({ version: '1.0.1', versionCode: 'nope' }), null);
});
