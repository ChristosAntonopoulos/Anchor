import assert from 'node:assert/strict';
import test from 'node:test';
import { theme } from './designTokens.ts';
import { contrastRatio, evaluateContrast, failingContrast } from './contrast.ts';

test('specified reading pairs meet the documented ratios', () => {
  assert.ok(contrastRatio(theme.textPrimary, theme.surface) >= 12.5);
  assert.ok(contrastRatio(theme.textSecondary, theme.surface) >= 7.5);
  assert.ok(contrastRatio(theme.onPrimary, theme.primary) >= 8);
});

test('semantic foreground and control pairs meet WCAG floors', () => {
  const failures = failingContrast();
  assert.deepEqual(
    failures.map((result) => `${result.pair.name} ${result.ratio.toFixed(2)}`),
    [],
  );
});

test('every evaluated pair reports a finite ratio', () => {
  for (const result of evaluateContrast()) {
    assert.ok(Number.isFinite(result.ratio));
    assert.ok(result.ratio > 1);
  }
});
