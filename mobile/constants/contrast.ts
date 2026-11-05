import { theme } from './designTokens';

const RELATIVE_LUMINANCE_CUTOFF = 0.03928;

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= RELATIVE_LUMINANCE_CUTOFF
    ? srgb / 12.92
    : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    throw new Error(`Expected a 6-digit hex colour, received ${hex}`);
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastRole = 'text' | 'largeText' | 'control';

export interface ContrastPair {
  name: string;
  foreground: string;
  background: string;
  role: ContrastRole;
  minimum: number;
}

const TEXT_AA = 4.5;
const TEXT_PREFERRED = 7;
const LARGE_TEXT = 3;
const CONTROL = 3;

export const contrastPairs: ContrastPair[] = [
  { name: 'textPrimary on background', foreground: theme.textPrimary, background: theme.background, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'textPrimary on surface', foreground: theme.textPrimary, background: theme.surface, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'textPrimary on surfaceRaised', foreground: theme.textPrimary, background: theme.surfaceRaised, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'textPrimary on surfaceHover', foreground: theme.textPrimary, background: theme.surfaceHover, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'textPrimary on primaryContainer', foreground: theme.textPrimary, background: theme.primaryContainer, role: 'text', minimum: TEXT_AA },
  { name: 'textPrimary on aiContainer', foreground: theme.textPrimary, background: theme.aiContainer, role: 'text', minimum: TEXT_AA },
  { name: 'textPrimary on successContainer', foreground: theme.textPrimary, background: theme.successContainer, role: 'text', minimum: TEXT_AA },
  { name: 'textPrimary on warningContainer', foreground: theme.textPrimary, background: theme.warningContainer, role: 'text', minimum: TEXT_AA },
  { name: 'textPrimary on dangerContainer', foreground: theme.textPrimary, background: theme.dangerContainer, role: 'text', minimum: TEXT_AA },
  { name: 'textSecondary on background', foreground: theme.textSecondary, background: theme.background, role: 'text', minimum: TEXT_AA },
  { name: 'textSecondary on surface', foreground: theme.textSecondary, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'textSecondary on surfaceRaised', foreground: theme.textSecondary, background: theme.surfaceRaised, role: 'text', minimum: TEXT_AA },
  { name: 'textMuted on surface', foreground: theme.textMuted, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'textMuted on surfaceRaised', foreground: theme.textMuted, background: theme.surfaceRaised, role: 'text', minimum: TEXT_AA },
  { name: 'onPrimary on primary', foreground: theme.onPrimary, background: theme.primary, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'onPrimary on primaryHover', foreground: theme.onPrimary, background: theme.primaryHover, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'onPrimary on primaryPressed', foreground: theme.onPrimary, background: theme.primaryPressed, role: 'text', minimum: TEXT_PREFERRED },
  { name: 'primary on background', foreground: theme.primary, background: theme.background, role: 'largeText', minimum: LARGE_TEXT },
  { name: 'primary on surface', foreground: theme.primary, background: theme.surface, role: 'largeText', minimum: LARGE_TEXT },
  { name: 'aiAccent on aiContainer', foreground: theme.aiAccent, background: theme.aiContainer, role: 'text', minimum: TEXT_AA },
  { name: 'aiAccent on surface', foreground: theme.aiAccent, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'success on successContainer', foreground: theme.success, background: theme.successContainer, role: 'text', minimum: TEXT_AA },
  { name: 'success on surface', foreground: theme.success, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'warning on warningContainer', foreground: theme.warning, background: theme.warningContainer, role: 'text', minimum: TEXT_AA },
  { name: 'warning on surface', foreground: theme.warning, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'danger on dangerContainer', foreground: theme.danger, background: theme.dangerContainer, role: 'text', minimum: TEXT_AA },
  { name: 'danger on surface', foreground: theme.danger, background: theme.surface, role: 'text', minimum: TEXT_AA },
  { name: 'borderControl on surface', foreground: theme.borderControl, background: theme.surface, role: 'control', minimum: CONTROL },
  { name: 'borderControl on surfaceRaised', foreground: theme.borderControl, background: theme.surfaceRaised, role: 'control', minimum: CONTROL },
  { name: 'borderControl on background', foreground: theme.borderControl, background: theme.background, role: 'control', minimum: CONTROL },
  { name: 'borderControl on primaryContainer', foreground: theme.borderControl, background: theme.primaryContainer, role: 'control', minimum: CONTROL },
  { name: 'primary on primaryContainer', foreground: theme.primary, background: theme.primaryContainer, role: 'control', minimum: CONTROL },
  { name: 'focusRing on background', foreground: theme.focusRing, background: theme.focusRingGap, role: 'control', minimum: CONTROL },
];

export interface ContrastResult {
  pair: ContrastPair;
  ratio: number;
  passes: boolean;
}

export function evaluateContrast(pairs: ContrastPair[] = contrastPairs): ContrastResult[] {
  return pairs.map((pair) => {
    const ratio = contrastRatio(pair.foreground, pair.background);
    return { pair, ratio, passes: ratio + 0.05 >= pair.minimum };
  });
}

export function failingContrast(pairs: ContrastPair[] = contrastPairs): ContrastResult[] {
  return evaluateContrast(pairs).filter((result) => !result.passes);
}
