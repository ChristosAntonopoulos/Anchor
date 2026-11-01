import { type ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { CalmGrowthIcon, isCalmGrowthName, type CalmGrowthName } from './CalmGrowthIcon';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const IONICON_TO_CALM: Partial<Record<string, CalmGrowthName>> = {
  close: 'close',
  'close-circle': 'close',
  'close-circle-outline': 'close',
  add: 'add',
  'add-circle-outline': 'add',
  'search-outline': 'search',
  checkmark: 'check',
  'checkmark-circle': 'check',
  'checkmark-circle-outline': 'check',
  'checkmark-done': 'check',
  'trash-outline': 'delete',
  'create-outline': 'edit',
  'calendar-outline': 'calendar',
  'notifications-outline': 'notification',
  'settings-outline': 'settings',
  'speedometer-outline': 'dashboard',
  'grid-outline': 'growth',
  'star-outline': 'habits',
  star: 'achievements',
  'lock-open-outline': 'focus',
  'cash-outline': 'goals',
  'document-text-outline': 'journal',
  'heart-outline': 'heart',
  'leaf-outline': 'leaf',
  'sparkles-outline': 'growth',
  sparkles: 'growth',
  'hourglass-outline': 'reminders',
  'bulb-outline': 'insights',
  'moon-outline': 'sleep',
  'apps-outline': 'dashboard',
  'chevron-forward': 'next',
  'save-outline': 'check',
  'nutrition-outline': 'nutrition',
};

interface AppIconProps {
  name: string;
  size?: number;
  color?: string;
  scheme?: 'light' | 'dark';
  opacity?: number;
  style?: StyleProp<ViewStyle | TextStyle>;
}

function resolveCalmName(name: string): CalmGrowthName | null {
  if (isCalmGrowthName(name)) {
    return name;
  }
  return IONICON_TO_CALM[name] ?? null;
}

/**
 * Renders a Calm Growth icon when a design exists for this name.
 * Dark (default) uses sage strokes for the app's dark screens; pass scheme="light"
 * for cream surfaces. Splash and launcher images follow system appearance separately.
 * Falls back to Ionicons for controls the pack does not include (play, location, …).
 */
export function AppIcon({
  name,
  size = 24,
  color,
  scheme = 'dark',
  opacity = 1,
  style,
}: AppIconProps) {
  const calmName = resolveCalmName(name);
  if (calmName) {
    return (
      <CalmGrowthIcon
        name={calmName}
        size={size}
        scheme={scheme}
        opacity={opacity}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  return (
    <Ionicons
      name={name as IoniconName}
      size={size}
      color={color}
      style={[{ opacity }, style as StyleProp<TextStyle>]}
    />
  );
}
