import { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import {
  CALM_GROWTH_NAMES,
  CALM_GROWTH_SVG,
  type CalmGrowthName,
} from './calmGrowthSvg';

export type { CalmGrowthName };

const NAME_SET = new Set<string>(CALM_GROWTH_NAMES);

export function isCalmGrowthName(name: string): name is CalmGrowthName {
  return NAME_SET.has(name);
}

interface CalmGrowthIconProps {
  name: CalmGrowthName;
  size?: number;
  /** Light icons are green on cream; dark icons follow the semantic dark theme. */
  scheme?: 'light' | 'dark';
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export function CalmGrowthIcon({
  name,
  size = 24,
  scheme = 'dark',
  color,
  opacity = 1,
  style,
}: CalmGrowthIconProps) {
  const xml = useMemo(() => {
    const source = CALM_GROWTH_SVG[scheme][name];
    if (!color) {
      return source;
    }
    return source
      .replace(/stroke="#[0-9A-Fa-f]{3,8}"/g, `stroke="${color}"`)
      .replace(/fill="#[0-9A-Fa-f]{3,8}"/g, `fill="${color}"`);
  }, [color, name, scheme]);

  return (
    <SvgXml xml={xml} width={size} height={size} opacity={opacity} style={style} />
  );
}
